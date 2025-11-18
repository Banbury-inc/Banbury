import { Mark, mergeAttributes } from '@tiptap/core'

// Mark for inserted text (green highlight)
// This is a completely custom implementation that doesn't rely on paid Tiptap features
export const Insertion = Mark.create({
  name: 'insertion',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'diff-insertion',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'ins',
      },
      {
        tag: 'span.diff-insertion',
      },
      {
        style: 'background-color',
        getAttrs: (value) => {
          if (typeof value === 'string' && (value.includes('#bbf7d0') || value.includes('rgb(187, 247, 208)'))) {
            return {}
          }
          return false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'diff-insertion',
        'data-diff': 'insertion',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setInsertion:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name)
        },
      toggleInsertion:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name)
        },
      unsetInsertion:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },
})

// Mark for deleted text (red highlight with strikethrough)
// This is a completely custom implementation that doesn't rely on paid Tiptap features
export const Deletion = Mark.create({
  name: 'deletion',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'diff-deletion',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'del',
      },
      {
        tag: 'span.diff-deletion',
      },
      {
        style: 'background-color',
        getAttrs: (value) => {
          if (typeof value === 'string' && (value.includes('#fecaca') || value.includes('rgb(254, 202, 202)'))) {
            return {}
          }
          return false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'diff-deletion',
        'data-diff': 'deletion',
      }),
      0,
    ]
  },

  addCommands() {
    return {
      setDeletion:
        () =>
        ({ commands }) => {
          return commands.setMark(this.name)
        },
      toggleDeletion:
        () =>
        ({ commands }) => {
          return commands.toggleMark(this.name)
        },
      unsetDeletion:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name)
        },
    }
  },
})

