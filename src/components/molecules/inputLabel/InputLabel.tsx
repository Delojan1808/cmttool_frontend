import Input, { type InputProps } from "../../atoms/input/Input"
import Label, { type LabelProps } from "../../atoms/label/Label";



export type InputLabelProps = {
  input: InputProps;
  label: LabelProps;
  labelClassName?: string;
  inputClassName?: string;
}
const InputLabel: React.FC<InputLabelProps> = ({ input, label, inputClassName, labelClassName }) => {
  return (
    <div >
      <Label labelContent={label.labelContent} htmlFor={label.htmlFor} className={[label.className, labelClassName].filter(Boolean).join(' ')} />
      <Input placeHolder={input.placeHolder} onChange={input.onChange} value={input.value} id={input.id} type={input.type} className={[input.className, inputClassName, "w-full"].filter(Boolean).join(' ')} />
    </div>
  )
}

export default InputLabel