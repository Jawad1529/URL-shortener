import { IonButton } from '@ionic/react';

const Button = ({
    label,
    onClick,
    type = 'button',
    color = 'primary',
    expand = 'block',
    disabled = false,
    size = 'default',
    className = '',
}) => (
    <IonButton
        type={type}
        onClick={onClick}
        color={color}
        expand={expand}
        disabled={disabled}
        size={size}
        className={`rounded-lg mt-3 ${className}`}
    >
        {label}
    </IonButton>
);

export default Button;
