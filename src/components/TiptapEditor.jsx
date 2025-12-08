import React from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { Box, IconButton, Tooltip, Paper, Divider } from '@mui/material'
import { FormatBold, FormatItalic, FormatUnderlined, FormatListBulleted, FormatListNumbered, FormatClear, Link as LinkIcon, Undo, Redo, FormatAlignLeft, FormatAlignCenter, FormatAlignRight, Title } from '@mui/icons-material'

export default function TiptapEditor({ value, onChange, placeholder = 'Enter your message here...' }) {
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      bulletList: true,
      orderedList: true,
      listItem: true,
    }),
    Underline,
    Link.configure({
      openOnClick: true,
      autolink: true,
      defaultProtocol: "https",
    }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    Placeholder.configure({ placeholder }),
  ],
  content: value || "",
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()   // 🔑 plain text નહીં, HTML
    onChange && onChange(html)
  },
  editorProps: {
    attributes: {
      class: "w-full min-h-[112px] text-sm outline-none px-3 py-2",
    },
  },
})



  if (!editor) return null

  return (
    <Box>
      <Paper variant="outlined" sx={{ borderRadius: 1, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.5, borderBottom: '1px solid', borderColor: 'divider', flexWrap: 'wrap' }}>
          <Tooltip title="Heading">
            <IconButton size="small" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} color={editor.isActive('heading', { level: 2 }) ? 'primary' : 'default'}>
              <Title fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Bold (Ctrl+B)"><IconButton size="small" onClick={() => editor.chain().focus().toggleBold().run()} color={editor.isActive('bold') ? 'primary' : 'default'}><FormatBold fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Italic (Ctrl+I)"><IconButton size="small" onClick={() => editor.chain().focus().toggleItalic().run()} color={editor.isActive('italic') ? 'primary' : 'default'}><FormatItalic fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Underline (Ctrl+U)"><IconButton size="small" onClick={() => editor.chain().focus().toggleUnderline().run()} color={editor.isActive('underline') ? 'primary' : 'default'}><FormatUnderlined fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Bullet list"><IconButton size="small" onClick={() => editor.chain().focus().toggleBulletList().run()} color={editor.isActive('bulletList') ? 'primary' : 'default'}><FormatListBulleted fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Ordered list"><IconButton size="small" onClick={() => editor.chain().focus().toggleOrderedList().run()} color={editor.isActive('orderedList') ? 'primary' : 'default'}><FormatListNumbered fontSize="small" /></IconButton></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Align left"><IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('left').run()} color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}><FormatAlignLeft fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Align center"><IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('center').run()} color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}><FormatAlignCenter fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Align right"><IconButton size="small" onClick={() => editor.chain().focus().setTextAlign('right').run()} color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}><FormatAlignRight fontSize="small" /></IconButton></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Insert link">
            <IconButton size="small" onClick={() => {
              const url = window.prompt('Enter URL') || ''
              if (!url) return
              try {
                const withProtocol = /^(https?:)?\/\//i.test(url) ? url : `https://${url}`
                editor.chain().focus().extendMarkRange('link').setLink({ href: withProtocol }).run()
              } catch (_) {}
            }} color={editor.isActive('link') ? 'primary' : 'default'}>
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear link">
            <IconButton size="small" onClick={() => editor.chain().focus().unsetLink().run()} disabled={!editor.isActive('link')}>
              <LinkIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear formatting"><IconButton size="small" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}><FormatClear fontSize="small" /></IconButton></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Undo (Ctrl+Z)"><IconButton size="small" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}><Undo fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Redo (Ctrl+Y)"><IconButton size="small" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}><Redo fontSize="small" /></IconButton></Tooltip>
        </Box>
        <Box sx={{ '& .ProseMirror': { minHeight: 112, p: 1 } }}>
          <EditorContent editor={editor} />
        </Box>
      </Paper>
    </Box>
  )
}
