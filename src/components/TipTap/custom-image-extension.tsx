import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { InteractiveImage } from './InteractiveImage';

export const CustomImage = Image.extend({

    draggable: true,

  addNodeView() {
    return ReactNodeViewRenderer(InteractiveImage);
  },
});