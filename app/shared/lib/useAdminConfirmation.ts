export type AdminConfirmationColor = "primary" | "error";

export type AdminConfirmationOptions = {
  cancelLabel?: string;
  color?: AdminConfirmationColor;
  confirmLabel?: string;
  description?: string;
  hint?: string;
  message?: string;
  title?: string;
  verificationLabel?: string;
  verificationPlaceholder?: string;
  verificationText?: string;
};

const defaultConfirmationOptions = {
  cancelLabel: "Отмена",
  color: "primary" as AdminConfirmationColor,
  confirmLabel: "Подтвердить",
  description: "",
  hint: "",
  message: "",
  title: "",
  verificationLabel: "",
  verificationPlaceholder: "",
  verificationText: ""
};

export function useAdminConfirmation() {
  const confirmOpen = ref(false);
  const confirmLoading = ref(false);
  const confirmOptions = reactive({ ...defaultConfirmationOptions });
  let confirmedAction: (() => Promise<void>) | null = null;

  function requestConfirm(
    options: AdminConfirmationOptions,
    action: () => Promise<void>
  ) {
    Object.assign(confirmOptions, defaultConfirmationOptions, options);
    confirmedAction = action;
    confirmOpen.value = true;
  }

  async function runConfirmedAction() {
    if (!confirmedAction) {
      confirmOpen.value = false;
      return;
    }

    confirmLoading.value = true;

    try {
      await confirmedAction();
      confirmOpen.value = false;
    } finally {
      confirmLoading.value = false;
      confirmedAction = null;
    }
  }

  watch(confirmOpen, (isOpen) => {
    if (!isOpen && !confirmLoading.value) {
      confirmedAction = null;
    }
  });

  return {
    confirmLoading,
    confirmOpen,
    confirmOptions,
    requestConfirm,
    runConfirmedAction
  };
}
