export type InputProps = {
  placeHolder: string;
  onChange: (e: any) => void;
  value: string;
  id: string;
  type: "text" | "number" | "password" | "email" | "tel";
  className: string;
};
const Input: React.FC<InputProps> = ({
  placeHolder,
  onChange,
  value,
  id,
  type = "text",
  className,
}) => {
  return (
    <input
      className={`input-glass ${className || ""}`}
      placeholder={placeHolder}
      onChange={onChange}
      value={value}
      type={type}
      id={id}
    />
  );
};
export default Input;
