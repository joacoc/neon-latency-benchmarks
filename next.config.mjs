import nextMdx from "@next/mdx";
import rehypeShiki from "@shikijs/rehype";
import {
  transformerNotationHighlight,
  transformerNotationFocus,
} from "@shikijs/transformers";

const withMdx = nextMdx({
  // By default only the `.mdx` extension is supported.
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [
      [
        rehypeShiki,
        {
          theme: "andromeeda",
          transformers: [
            transformerNotationHighlight(),
            transformerNotationFocus(),
          ],
        },
      ],
    ],
  },
});

const nextConfig = withMdx({
  // Support MDX files as pages:
  pageExtensions: ["md", "mdx", "tsx", "ts", "jsx", "js"],
});

export default nextConfig;
