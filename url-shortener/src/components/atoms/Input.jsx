import { IonInput } from '@ionic/react';

const Input = ({
    label,
    placeholder,
    value,
    onIonInput,
    type = 'text',
    disabled = false,
}) => (
    <IonInput
        label={label}
        labelPlacement="floating"
        placeholder={placeholder}
        value={value}
        onIonInput={onIonInput}
        type={type}
        disabled={disabled}
        fill="outline"
        className="rounded-lg mb-2"
    />
);

export default Input;
