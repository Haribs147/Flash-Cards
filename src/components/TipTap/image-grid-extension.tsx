import { Node, mergeAttributes } from "@tiptap/core";

export const ImageGrid = Node.create({
  name: "imageGrid",
  group: "block",
  content: "image image",

  draggable: true,

  parseHTML() {
    return [{ tag: 'div[data-type="image-grid"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "image-grid" }),
      0,
    ];
  },
});
