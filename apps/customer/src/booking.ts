export type BookingDraft = {
  id: string;
  serviceId: string;
  serviceName: string;
  basePricePaise: number;
  address: string;
  note: string;
  preferredDate: string;
  preferredTime: string;
};

export type BookingInput = Omit<BookingDraft, 'id'>;
export const TIME_OPTIONS = [
  { value: '09:00', label: '9:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '17:00', label: '5:00 PM' },
] as const;

export function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
export function upcomingDays(now = new Date(), count = 7): Array<{ id: string; day: string; number: string; full: string }> {
  const values = [];
  for (let offset = 1; offset <= count; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, 12);
    values.push({
      id: localDateKey(date),
      day: new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(date),
      number: String(date.getDate()),
      full: new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'short' }).format(date),
    });
  }
  return values;
}
export function validateDraft(input: BookingInput, now = new Date()): string | null {
  if (!input.serviceId.trim() || !input.serviceName.trim() || !Number.isSafeInteger(input.basePricePaise)) {
    return 'Select a valid service.';
  }
  if (input.address.trim().length < 10 || input.address.trim().length > 240) {
    return 'Enter a service address between 10 and 240 characters.';
  }
  if (input.note.trim().length > 500) return 'Problem description must be 500 characters or fewer.';
  if (!upcomingDays(now).some((day) => day.id === input.preferredDate)) return 'Select one of the next seven days.';
  if (!TIME_OPTIONS.some((time) => time.value === input.preferredTime)) return 'Choose a preferred time.';
  return null;
}
export function formatPreferredSlot(draft: Pick<BookingInput, 'preferredDate' | 'preferredTime'>): string {
  const day = new Date(`${draft.preferredDate}T12:00:00`);
  const formatted = Number.isNaN(day.getTime()) ? draft.preferredDate
    : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(day);
  const label = TIME_OPTIONS.find((time) => time.value === draft.preferredTime)?.label ?? draft.preferredTime;
  return `${formatted} · ${label}`;
}
