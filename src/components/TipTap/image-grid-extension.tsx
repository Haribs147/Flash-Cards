import { Node, mergeAttributes } from "@tiptap/core";

export const ImageGrid = Node.create({
  name: "imageGrid",
  group: "block",
  content: "image+",
  draggable: true,

  addAttributes() {
    return {
      cols: {
        default: 2,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-grid"]',
        getAttrs: (dom) => ({
          cols: parseInt(dom.getAttribute("data-cols") || "2", 10),
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "image-grid",
        "data-cols": HTMLAttributes.cols,
        style: `--cols: ${HTMLAttributes.cols}`,
      }),
      0,
    ];
  },
});
