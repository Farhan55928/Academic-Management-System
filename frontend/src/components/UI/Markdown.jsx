import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Raw HTML in the source is escaped (react-markdown's default), so pasted
// content can't inject markup or scripts.
const components = {
  a: (props) => (
    <a href={props.href} title={props.title} target="_blank" rel="noopener noreferrer">{props.children}</a>
  ),
  table: (props) => (
    <div className="md-table-wrap"><table>{props.children}</table></div>
  ),
};

export default function Markdown({ children, className = '' }) {
  return (
    <div className={`md-prose ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children || ''}
      </ReactMarkdown>
    </div>
  );
}
