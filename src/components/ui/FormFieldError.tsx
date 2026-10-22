import { LuCircleAlert as CircleAlert } from "react-icons/lu";

type FormFieldErrorProps = {
  id: string;
  message?: string;
};

/** Accessible, consistent inline validation feedback for form fields. */
export default function FormFieldError({ id, message }: FormFieldErrorProps) {
  if (!message) return null;

  return (
    <p id={id} role="alert" className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-600">
      <CircleAlert aria-hidden="true" className="mt-px shrink-0" size={14} />
      <span>{message}</span>
    </p>
  );
}
