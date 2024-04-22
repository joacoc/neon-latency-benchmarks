import type { MDXComponents } from 'mdx/types'
import slugify from '@sindresorhus/slugify'

export function useMDXComponents(components: MDXComponents): MDXComponents {
    return {
        // Allows customizing built-in components, e.g. to add styling.
        h1: ({ children }) => <h1 id={slugify(children ? children.toString() : '')} className="mt-16">{children}</h1>,
        h2: ({ children }) => <h2 id={slugify(children ? children.toString() : '')} className="mt-8">{children}</h2>,
        h3: ({ children }) => <h3 id={slugify(children ? children.toString() : '')}>{children}</h3>,
        ...components,
    }
}