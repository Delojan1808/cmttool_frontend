export type LabelProps = {
  labelContent: string;
  htmlFor: string;
  className: string;
}
const Label: React.FC<LabelProps> = ({ labelContent, htmlFor, className }) => {
  return (
    <div style={{ marginBottom: '0.25rem' }}><label className={className} htmlFor={htmlFor} style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{labelContent}</label></div>
  )
}

export default Label