export type ButtonProps = {
  buttonContent: React.ReactNode;
  className: string;
  type: "button" | "reset" | "submit";

};
const Button: React.FC<ButtonProps> = ({ buttonContent, className, type = "button" }) => {
  return <button type={type} className={`btn-primary ${className || ""}`}>{buttonContent}</button>;
};

export default Button;
