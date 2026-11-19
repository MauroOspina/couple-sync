import { useState } from 'react';

import { AppText, Button, Sheet, TextField } from '@/components/ui';
import { parseAmount } from '@/domain/purchases';

interface FinishShoppingSheetProps {
  visible: boolean;
  /** Productos en el carrito. */
  count: number;
  onClose: () => void;
  onConfirm: (total: number | null) => void;
}

/** Confirma el fin del mercado y pregunta (opcional) cuánto gastaron, para el historial. */
export function FinishShoppingSheet({ visible, count, onClose, onConfirm }: FinishShoppingSheetProps) {
  const [amount, setAmount] = useState('');

  const close = () => {
    setAmount('');
    onClose();
  };

  const confirm = () => {
    const total = parseAmount(amount);
    setAmount('');
    onConfirm(total);
  };

  return (
    <Sheet
      visible={visible}
      onClose={close}
      title="Terminar mercado"
      footer={<Button label={`Terminar mercado · ${count}`} icon="check" onPress={confirm} />}>
      <AppText tone="muted">
        {count} {count === 1 ? 'producto pasará' : 'productos pasarán'} a &quot;Hay&quot; en la despensa y el mercado queda en el historial.
      </AppText>
      <TextField
        label="¿Cuánto gastaron? (opcional)"
        value={amount}
        onChangeText={setAmount}
        placeholder="Ej: 185.000"
        keyboardType="number-pad"
        returnKeyType="done"
        onSubmitEditing={confirm}
      />
    </Sheet>
  );
}
