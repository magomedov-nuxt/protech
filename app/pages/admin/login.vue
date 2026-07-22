<template>
  <main class="admin-shell grid min-h-screen place-items-center px-5 py-12" data-admin-theme>
    <UCard class="admin-card w-full max-w-xl" :ui="{ body: 'p-6 sm:p-8' }">
      <div class="mb-7 space-y-5 text-center">
        <div class="admin-icon-tile mx-auto size-14">
          <Zap class="size-7" />
        </div>
        <div>
          <h1 class="text-2xl font-semibold text-(--admin-text)">
            Вход в панель администратора ПроТех76
          </h1>
          <p class="mt-2 text-sm leading-6 text-(--admin-text-muted)">
            Используйте учетную запись с ролью ADMIN.
          </p>
        </div>
      </div>

      <form class="space-y-6" @submit.prevent="login">
        <UFormField label="Email" required :error="fieldErrors.email">
          <UInput v-model="form.email" class="w-full" size="xl" type="email" autocomplete="email"
            placeholder="admin.demo@protech.local">
            <template #leading>
              <Mail class="size-5 text-(--admin-text-muted)" />
            </template>
          </UInput>
        </UFormField>

        <UFormField label="Пароль" required :error="fieldErrors.password">
          <UInput v-model="form.password" class="w-full" size="xl" :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password" placeholder="Введите пароль">
            <template #leading>
              <LockKeyhole class="size-5 text-(--admin-text-muted)" />
            </template>
            <template #trailing>
              <UButton color="neutral" variant="ghost" size="lg" square type="button" class="admin-touch-icon"
                :aria-label="showPassword ? 'Скрыть пароль' : 'Показать пароль'" @click="togglePasswordVisibility">
                <EyeOff v-if="showPassword" class="size-5" />
                <Eye v-else class="size-5" />
              </UButton>
            </template>
          </UInput>
        </UFormField>

        <USwitch v-model="form.rememberMe" label="Запомнить меня" size="xl"
          :ui="{ root: 'items-center', container: 'h-11', base: 'h-11 w-[4.5rem]', thumb: 'size-8 data-[state=checked]:translate-x-7 data-[state=checked]:rtl:-translate-x-7' }" />

        <UButton color="primary" size="xl" block type="submit" :loading="loading"
          class="min-h-12 rounded-md shadow-lg shadow-emerald-800/15">
          <LogIn class="size-5" />
          Войти
        </UButton>
      </form>

      <div class="mt-7 flex justify-center">
        <UButton color="neutral" variant="ghost" icon="i-lucide-store" size="lg" to="/" class="h-11 rounded-md px-4">
          Вернуться в магазин
        </UButton>
      </div>
    </UCard>
  </main>
</template>

<script setup lang="ts">
import { Eye, EyeOff, LockKeyhole, LogIn, Mail, Zap } from "@lucide/vue";
import { z } from "zod";
import { toast } from "vue-sonner";
import { clearFieldErrors, getZodFieldErrors, replaceFieldErrors } from "~~/app/shared/lib/zodValidation";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import type { AdminUser } from "~~/app/shared/types/admin";

definePageMeta({
  layout: false
});

useHead({
  title: "Вход в админ-панель"
});

const loginSchema = z.strictObject({
  email: z.email("Введите корректный email"),
  password: z.string().min(1, "Введите пароль"),
  rememberMe: z.boolean()
});

const route = useRoute();
const form = reactive({
  email: "",
  password: "",
  rememberMe: true
});
const fieldErrors = reactive<Record<string, string | undefined>>({});
const loading = ref(false);
const showPassword = ref(false);

const redirectTo = computed(() => {
  const redirect = Array.isArray(route.query.redirect) ? route.query.redirect[0] : route.query.redirect;
  return redirect?.startsWith("/admin") && redirect !== "/admin/login" ? redirect : "/admin";
});

async function login() {
  const parsed = loginSchema.safeParse(form);

  if (!parsed.success) {
    replaceFieldErrors(fieldErrors, getZodFieldErrors(parsed.error));
    toast.error("Проверьте поля формы");
    return;
  }

  clearFieldErrors(fieldErrors);
  loading.value = true;

  try {
    await $fetch("/api/auth/sign-in/email", {
      method: "POST",
      credentials: "include",
      body: parsed.data
    });

    await adminFetch<{ user: AdminUser }>("/api/admin/me");
    await adminFetch("/api/admin/auth/login-audit", { method: "POST" }).catch(() => undefined);
    toast.success("Добро пожаловать в админ-панель");
    await navigateTo(redirectTo.value, { replace: true });
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось войти или у аккаунта нет прав ADMIN"));
  } finally {
    loading.value = false;
  }
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value;
}
</script>
