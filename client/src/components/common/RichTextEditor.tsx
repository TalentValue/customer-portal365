import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { useEditor, EditorContent, ReactRenderer } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Mention from '@tiptap/extension-mention'
import { Bold, Italic, List, ListOrdered, Code } from 'lucide-react'
import DOMPurify from 'dompurify'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

interface User { id: string; firstName: string; lastName: string }

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  users?: User[]
}

const MentionList = forwardRef(({ items, command }: { items: User[]; command: (a: any) => void }, ref: any) => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const selectItem = (index: number) => {
    const item = items[index]
    if (item) command({ id: item.id, label: `${item.firstName} ${item.lastName}` })
  }

  useEffect(() => setSelectedIndex(0), [items])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') { setSelectedIndex((i) => (i + items.length - 1) % items.length); return true }
      if (event.key === 'ArrowDown') { setSelectedIndex((i) => (i + 1) % items.length); return true }
      if (event.key === 'Enter') { selectItem(selectedIndex); return true }
      return false
    },
  }))

  if (!items.length) return <div className="p-2 text-xs text-muted-foreground">No users found</div>

  return (
    <div>
      {items.map((item, index) => (
        <button
          key={item.id}
          className={cn('w-full text-left px-3 py-1.5 text-sm rounded hover:bg-accent', index === selectedIndex && 'bg-accent')}
          onClick={() => selectItem(index)}
        >
          {item.firstName} {item.lastName}
        </button>
      ))}
    </div>
  )
})
MentionList.displayName = 'MentionList'

function buildMentionExtension(users: User[]) {
  return Mention.configure({
    HTMLAttributes: { class: 'mention font-semibold text-primary', 'data-type': 'mention' },
    suggestion: {
      items: ({ query }: { query: string }) =>
        users.filter((u) => `${u.firstName} ${u.lastName}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6),
      render: () => {
        let component: ReactRenderer
        let popup: HTMLDivElement

        return {
          onStart: (props: any) => {
            popup = document.createElement('div')
            popup.className = 'z-50 fixed bg-popover border rounded-md shadow-md p-1 min-w-[160px]'
            document.body.appendChild(popup)
            component = new ReactRenderer(MentionList, { props, editor: props.editor })
            popup.appendChild(component.element as Node)
            const rect = props.clientRect?.()
            if (rect) {
              popup.style.top = `${rect.bottom + window.scrollY + 4}px`
              popup.style.left = `${rect.left + window.scrollX}px`
            }
          },
          onUpdate: (props: any) => {
            component.updateProps(props)
            const rect = props.clientRect?.()
            if (rect) {
              popup.style.top = `${rect.bottom + window.scrollY + 4}px`
              popup.style.left = `${rect.left + window.scrollX}px`
            }
          },
          onKeyDown: (props: any) => (component.ref as any)?.onKeyDown(props) ?? false,
          onExit: () => { component.destroy(); popup.remove() },
        }
      },
    },
  })
}

export function RichTextEditor({ value, onChange, placeholder = 'Write something...', className, users }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      ...(users?.length ? [buildMentionExtension(users)] : []),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none min-h-[80px] px-3 py-2 focus:outline-none',
      },
    },
  })

  if (!editor) return null

  return (
    <div className={cn('rounded-md border bg-background overflow-hidden', className)}>
      <div className="flex items-center gap-0.5 border-b px-2 py-1">
        <Button type="button" variant="ghost" size="icon" className={cn('h-6 w-6', editor.isActive('bold') && 'bg-accent')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={cn('h-6 w-6', editor.isActive('italic') && 'bg-accent')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={cn('h-6 w-6', editor.isActive('bulletList') && 'bg-accent')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={cn('h-6 w-6', editor.isActive('orderedList') && 'bg-accent')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className={cn('h-6 w-6', editor.isActive('code') && 'bg-accent')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="h-3.5 w-3.5" />
        </Button>
        {users && <span className="text-xs text-muted-foreground ml-2">Type @ to mention</span>}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}

interface RichTextDisplayProps { html: string; className?: string }

export function RichTextDisplay({ html, className }: RichTextDisplayProps) {
  return (
    <div
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
    />
  )
}
