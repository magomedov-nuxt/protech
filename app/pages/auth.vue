<template>
  <div class="mx-auto grid min-h-[calc(100dvh-9rem)] w-full max-w-295 items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1fr)] lg:px-8">
    <section class="hidden lg:block">
      <UBadge color="primary" variant="soft" class="rounded-full">
        Аккаунт покупателя
      </UBadge>
      <h1 class="mt-5 text-5xl font-semibold tracking-normal text-zinc-950 ">
        Войдите, чтобы покупки стали удобнее
      </h1>
      <div class="mt-8 grid gap-4">
        <div v-for="item in benefits" :key="item.title"
          class="flex gap-4 rounded-3xl bg-white p-4 shadow-sm shadow-zinc-950/5  ">
          <div class="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700  ">
            <component :is="item.icon" class="size-5" />
          </div>
          <div>
            <p class="font-semibold text-zinc-950">{{ item.title }}</p>
            <p class="mt-1 text-sm leading-6 text-zinc-500">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <UCard class="rounded-4xl bg-white ring-0 shadow-2xl shadow-zinc-950/10  " :ui="{ body: 'p-6 sm:p-8' }">
      <div class="mb-7">
        <div class="grid grid-cols-2 rounded-full bg-[#f9fafb] p-1 " role="tablist" aria-label="Режим авторизации">
          <button type="button" class="rounded-full px-4 py-2 text-sm font-medium transition"
            role="tab"
            :aria-selected="mode === 'login'"
            :class="mode === 'login' ? 'bg-white text-zinc-950 shadow-sm shadow-zinc-950/5' : 'text-zinc-500 '"
            @click="mode = 'login'">
            Вход
          </button>
          <button type="button" class="rounded-full px-4 py-2 text-sm font-medium transition"
            role="tab"
            :aria-selected="mode === 'register'"
            :class="mode === 'register' ? 'bg-white text-zinc-950 shadow-sm shadow-zinc-950/5' : 'text-zinc-500 '"
            @click="mode = 'register'">
            Регистрация
          </button>
        </div>
      </div>

      <form class="space-y-5" @submit.prevent="submit">
        <UFormField v-if="mode === 'register'" label="Имя" required :error="fieldErrors.name">
          <UInput v-model="form.name" class="w-full rounded-2xl bg-[#f9fafb] " size="xl" variant="none"
            autocomplete="name" placeholder="Как к вам обращаться" :ui="{ base: 'h-12 rounded-2xl bg-transparent' }">
            <template #leading>
              <UserRound class="size-5 text-zinc-400" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Email" required :error="fieldErrors.email">
          <UInput v-model="form.email" class="w-full rounded-2xl bg-[#f9fafb] " size="xl" variant="none" type="email"
            autocomplete="email" placeholder="you@example.com" :ui="{ base: 'h-12 rounded-2xl bg-transparent' }">
            <template #leading>
              <Mail class="size-5 text-zinc-400" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Пароль" required :error="fieldErrors.password">
          <UInput v-model="form.password" class="w-full rounded-2xl bg-[#f9fafb] " size="xl" variant="none"
            :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Минимум 8 символов"
            :ui="{ base: 'h-12 rounded-2xl bg-transparent' }">
            <template #leading>
              <LockKeyhole class="size-5 text-zinc-400" />
            </template>
            <template #trailing>
              <UButton color="neutral" variant="ghost" size="sm" square class="rounded-full" type="button"
                :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'" @click="togglePasswordVisibility">
                <EyeOff v-if="showPassword" class="size-5" />
                <Eye v-else class="size-5" />
              </UButton>
            </template>
          </UInput>
        </UFormField>

        <USwitch v-model="form.rememberMe" label="Запомнить меня" />

        <UButton color="primary" size="xl" block class="rounded-full" type="submit" :loading="auth.pending">
          <LogIn class="size-5" />
          {{ mode === "login" ? "Войти" : "Создать аккаунт" }}
        </UButton>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { Eye, EyeOff, Heart, LockKeyhole, LogIn, Mail, PackageCheck, ShoppingCart, UserRound } from "@lucide/vue";
import { z } from "zod";
import { toast } from "vue-sonner";
import { clearFieldErrors, getZodFieldErrors, replaceFieldErrors } from "~~/app/shared/lib/zodValidation";
import { getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";

useSeoMeta({
  title: "Вход и регистрация",
  description: "Войдите или создайте аккаунт ПроТех76, чтобы пользоваться корзиной, избранным и историей заказов."
});

const route = useRoute();
const auth = useAuthStore();
const cart = useCartStore();
const favorites = useFavoritesStore();
const mode = ref<"login" | "register">(route.query.mode === "register" ? "register" : "login");
const showPassword = ref(false);
const fieldErrors = reactive<Record<string, string | undefined>>({});
const form = reactive({
  name: "",
  email: auth.lastEmail,
  password: "",
  rememberMe: true
});

const loginPayload = computed(() => ({
  email: form.email,
  password: form.password,
  rememberMe: form.rememberMe
}));

const benefits = [
  {
    title: "Корзина синхронизируется",
    description: "Добавленные товары сохраняются в аккаунте и доступны после повторного входа.",
    icon: ShoppingCart
  },
  {
    title: "Избранное под рукой",
    description: "Сохраняйте интересные позиции и возвращайтесь к ним перед покупкой.",
    icon: Heart
  },
  {
    title: "История заказов",
    description: "Отслеживайте статусы, оплату и состав каждого оформленного заказа.",
    icon: PackageCheck
  }
];

const loginSchema = z.strictObject({
  email: z.email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
  rememberMe: z.boolean()
});

const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2, "Введите имя").max(80, "Имя слишком длинное"),
  password: z.string().min(8, "Пароль должен быть не короче 8 символов")
});

const redirectTo = computed(() => {
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect;
  return redirect?.startsWith("/") && !redirect.startsWith("/admin") ? redirect : "/";
});

const verificationCallbackUrl = computed(() => {
  const params = new URLSearchParams({ verified: "1" });

  if (redirectTo.value !== "/") {
    params.set("redirect", redirectTo.value);
  }

  return `/auth?${params.toString()}`;
});

onMounted(async () => {
  const verified = Array.isArray(route.query.verified) ? route.query.verified[0] : route.query.verified;

  if (verified !== "1") {
    return;
  }

  const user = auth.user ?? await auth.fetchMe();

  if (user) {
    toast.success("Почта подтверждена");
    await navigateTo(redirectTo.value, { replace: true });
    return;
  }

  mode.value = "login";
  toast.success("Почта подтверждена. Теперь войдите в аккаунт");
});

async function submit() {
  const parsed = mode.value === "login"
    ? { mode: "login" as const, result: loginSchema.safeParse(loginPayload.value) }
    : { mode: "register" as const, result: registerSchema.safeParse(form) };

  if (!parsed.result.success) {
    replaceFieldErrors(fieldErrors, getZodFieldErrors(parsed.result.error));
    toast.error("Проверьте поля формы");
    return;
  }

  clearFieldErrors(fieldErrors);

  try {
    if (parsed.mode === "login") {
      await auth.login({
        ...parsed.result.data,
        callbackURL: verificationCallbackUrl.value
      });
      toast.success("Вы вошли в аккаунт");
    } else {
      await auth.register({
        ...parsed.result.data,
        callbackURL: verificationCallbackUrl.value
      });
      mode.value = "login";
      form.password = "";
      toast.success("Аккаунт создан. Проверьте почту и подтвердите email");
      return;
    }

    await Promise.all([
      cart.fetchCart(),
      favorites.fetchFavorites()
    ]);
    await navigateTo(redirectTo.value, { replace: true });
  } catch (error) {
    toast.error(getAuthErrorMessage(error, mode.value === "login" ? "Не удалось войти" : "Не удалось создать аккаунт"));
  }
}

function getAuthErrorMessage(error: unknown, fallback: string) {
  const message = getErrorMessage(error, fallback);

  if (message === "Email not verified" || message === "EMAIL_NOT_VERIFIED") {
    return "Подтвердите почту: мы отправили письмо со ссылкой";
  }

  return message;
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}
</script>
