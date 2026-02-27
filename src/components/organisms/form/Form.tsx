import Button, { type ButtonProps } from "../../atoms/button/Button";
import InputLabel, { type InputLabelProps } from "../../molecules/inputLabel/InputLabel";

type FormProps = {
  title: string;
  inputField: InputLabelProps[];
  button: ButtonProps;
};
const Form: React.FC<FormProps> = ({ button, inputField, title }) => {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: '420px', margin: '2rem auto' }}>
      <h2 style={{ marginBottom: '0.5rem', color: 'var(--primary-hover)', textAlign: 'center' }}>{title}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '1.25rem' }}>
        {inputField.map((field, index) => (
          <InputLabel
            key={index}
            label={field.label}
            input={field.input}
          />
        ))}
      </div>

      <div style={{ display: 'flex', width: '100%', marginTop: '1rem' }}>
        <Button
          className={button.className || "btn-primary"}
          type={button.type}
          buttonContent={button.buttonContent}
        />
      </div>
    </div>
  );
};
export default Form;
