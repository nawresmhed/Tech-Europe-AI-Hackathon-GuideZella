export const MarkdownComponents = {
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-200"
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  ),
};
