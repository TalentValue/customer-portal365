import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/useToast'
import { Send } from 'lucide-react'
import api from '@/services/api'

interface SettingRow { id: string; key: string; value: string }

function byKey(settings: SettingRow[], key: string) {
  return settings.find((s) => s.key === key)?.value ?? ''
}

function hexToHSL(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
  'America/Toronto', 'America/Vancouver', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Europe/Amsterdam', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo',
  'Asia/Shanghai', 'Australia/Sydney', 'Pacific/Auckland',
]

export default function Settings() {
  const { toast } = useToast()
  const [testingEmail, setTestingEmail] = useState(false)

  const { data: settings = [], isLoading } = useQuery<SettingRow[]>({
    queryKey: ['settings'],
    queryFn: () => api.get('/settings').then((r) => r.data),
  })

  const saveMutation = useMutation({
    mutationFn: (pairs: { key: string; value: string }[]) =>
      api.put('/settings', { settings: pairs }),
    onSuccess: () => toast({ title: 'Settings saved' }),
    onError: () => toast({ title: 'Failed to save settings', variant: 'destructive' }),
  })

  // General
  const general = useForm({ defaultValues: { company_name: '', support_email: '', timezone: 'UTC' } })
  // Email
  const email = useForm({ defaultValues: { smtp_from: '', smtp_reply_to: '' } })
  // Reminders
  const reminders = useForm({ defaultValues: { reminder_default_frequency: '', auto_close_days: '', sla_default_hours: '' } })
  // Branding — use watch to keep color picker + text input in sync
  const branding = useForm({ defaultValues: { primary_color: '#6366f1', logo_url: '' } })
  const primaryColor = branding.watch('primary_color')
  const timezoneValue = general.watch('timezone')

  useEffect(() => {
    if (primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)) {
      document.documentElement.style.setProperty('--primary', hexToHSL(primaryColor))
    }
  }, [primaryColor])

  useEffect(() => {
    if (!settings.length) return
    general.reset({
      company_name: byKey(settings, 'company_name'),
      support_email: byKey(settings, 'support_email'),
      timezone: byKey(settings, 'timezone') || 'UTC',
    })
    email.reset({
      smtp_from: byKey(settings, 'smtp_from'),
      smtp_reply_to: byKey(settings, 'smtp_reply_to'),
    })
    reminders.reset({
      reminder_default_frequency: byKey(settings, 'reminder_default_frequency'),
      auto_close_days: byKey(settings, 'auto_close_days'),
      sla_default_hours: byKey(settings, 'sla_default_hours'),
    })
    branding.reset({
      primary_color: byKey(settings, 'primary_color') || '#6366f1',
      logo_url: byKey(settings, 'logo_url'),
    })
  }, [settings]) // eslint-disable-line react-hooks/exhaustive-deps

  const save = (values: Record<string, string>) => {
    const pairs = Object.entries(values)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([key, value]) => ({ key, value: String(value) }))
    saveMutation.mutate(pairs)
  }

  const sendTestEmail = async () => {
    setTestingEmail(true)
    try {
      const res = await api.post('/settings/test-email')
      toast({ title: (res.data as any).message ?? 'Test email sent' })
    } catch {
      toast({ title: 'Failed to send test email', variant: 'destructive' })
    } finally {
      setTestingEmail(false)
    }
  }

  if (isLoading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground text-sm">Manage your platform configuration</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic platform configuration</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={general.handleSubmit(save)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <Input {...general.register('company_name')} placeholder="ClientPortal365" />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input type="email" {...general.register('support_email')} placeholder="support@yourdomain.com" />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={timezoneValue} onValueChange={(v) => general.setValue('timezone', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Outgoing email settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={email.handleSubmit(save)} className="space-y-4">
                <div className="space-y-2">
                  <Label>From Email</Label>
                  <Input type="email" {...email.register('smtp_from')} placeholder="noreply@yourdomain.com" />
                </div>
                <div className="space-y-2">
                  <Label>Reply-To Email</Label>
                  <Input type="email" {...email.register('smtp_reply_to')} placeholder="support@yourdomain.com" />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : 'Save Email Settings'}
                  </Button>
                  <Button type="button" variant="outline" disabled={testingEmail} onClick={sendTestEmail}>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    {testingEmail ? 'Sending...' : 'Send Test Email'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders">
          <Card>
            <CardHeader>
              <CardTitle>Reminder Defaults</CardTitle>
              <CardDescription>Default automation and reminder settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={reminders.handleSubmit(save)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Reminder Frequency (hours)</Label>
                  <Input type="number" {...reminders.register('reminder_default_frequency')} min={1} />
                </div>
                <div className="space-y-2">
                  <Label>SLA Default (hours)</Label>
                  <Input type="number" {...reminders.register('sla_default_hours')} min={1} />
                </div>
                <div className="space-y-2">
                  <Label>Auto-close Inactive Tickets After (days)</Label>
                  <Input type="number" {...reminders.register('auto_close_days')} min={1} />
                </div>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save Reminder Settings'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Customize the look and feel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={branding.handleSubmit(save)} className="space-y-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-3 items-center">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => branding.setValue('primary_color', e.target.value)}
                      className="h-10 w-16 rounded-md border cursor-pointer p-1"
                    />
                    <Input
                      value={primaryColor}
                      onChange={(e) => branding.setValue('primary_color', e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1 font-mono"
                    />
                  </div>
                  <div className="h-8 rounded-md border" style={{ backgroundColor: primaryColor }} />
                </div>
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input {...branding.register('logo_url')} placeholder="https://yourcompany.com/logo.png" />
                  <p className="text-xs text-muted-foreground">Enter a URL to your logo image (PNG or SVG recommended)</p>
                </div>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : 'Save Branding'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
