// Guest page strings. Nepali first, like the app; numerals follow the language.
import { localizeDigits, type Lang } from '../shared/numerals';
import { formatMoney } from '../shared/money';

import type { GuestError, Named } from './api';

const en = {
  table: 'Table {label}',
  switchLang: 'नेपाली',
  switchLangLabel: 'Switch to Nepali',
  loading: 'Opening the menu…',
  categories: 'Menu sections',
  add: 'Add',
  addLabel: 'Add {name}',
  less: 'One less {name}',
  more: 'One more {name}',
  qty: '{n} in your order',
  soldOut: 'Sold out',
  viewOrder: 'View order',
  items: '{n} items',
  yourOrder: 'Your order',
  close: 'Close',
  note: 'Anything for the kitchen?',
  notePlaceholder: 'Less spicy, no onion…',
  total: 'Total',
  send: 'Send to kitchen',
  sending: 'Sending…',
  emptyCart: 'Nothing added yet.',
  sentTitle: 'Order sent',
  sentAccepted: 'The kitchen has your order.',
  sentNeedsAccept: 'The staff will confirm your order shortly.',
  payAtCounter: 'Pay at the counter when you are done.',
  orderMore: 'Order more',
  retry: 'Try again',
  errors: {
    unknown_table: 'This QR code is not linked to a table. Please ask the staff.',
    unknown_menu: 'This menu link is not valid. Please ask the staff for the QR code.',
    ordering_off: 'Ordering from the phone is off here. Please order with the staff.',
    unavailable: 'Something in your order just ran out. Please check the menu again.',
    too_many: 'Too many orders from this phone. Please ask the staff.',
    network: 'No internet connection. Check it and try again.',
    unknown: 'Something went wrong. Please try again or ask the staff.',
  } satisfies Record<GuestError, string>,
};

type Strings = typeof en;

const ne: Strings = {
  table: 'टेबल {label}',
  switchLang: 'English',
  switchLangLabel: 'अंग्रेजीमा हेर्नुहोस्',
  loading: 'मेनु खुल्दैछ…',
  categories: 'मेनुका भागहरू',
  add: 'थप्नुहोस्',
  addLabel: '{name} थप्नुहोस्',
  less: '{name} एउटा घटाउनुहोस्',
  more: '{name} एउटा थप्नुहोस्',
  qty: 'अर्डरमा {n}',
  soldOut: 'सकियो',
  viewOrder: 'अर्डर हेर्नुहोस्',
  items: '{n} वटा',
  yourOrder: 'तपाईंको अर्डर',
  close: 'बन्द गर्नुहोस्',
  note: 'भान्साका लागि केही?',
  notePlaceholder: 'कम पिरो, प्याज नहाल्ने…',
  total: 'जम्मा',
  send: 'भान्सामा पठाउनुहोस्',
  sending: 'पठाउँदै…',
  emptyCart: 'अहिलेसम्म केही थपिएको छैन।',
  sentTitle: 'अर्डर पठाइयो',
  sentAccepted: 'भान्सामा तपाईंको अर्डर पुग्यो।',
  sentNeedsAccept: 'कर्मचारीले छिट्टै तपाईंको अर्डर पक्का गर्नुहुनेछ।',
  payAtCounter: 'खाना सकिएपछि काउन्टरमा भुक्तानी गर्नुहोस्।',
  orderMore: 'अझै अर्डर गर्नुहोस्',
  retry: 'फेरि प्रयास गर्नुहोस्',
  errors: {
    unknown_table: 'यो QR कोड कुनै टेबलसँग जोडिएको छैन। कर्मचारीलाई सोध्नुहोस्।',
    unknown_menu: 'यो मेनु लिङ्क मान्य छैन। कर्मचारीसँग QR कोड सोध्नुहोस्।',
    ordering_off: 'यहाँ फोनबाट अर्डर बन्द छ। कर्मचारीसँग अर्डर गर्नुहोस्।',
    unavailable: 'तपाईंको अर्डरको कुनै परिकार भर्खरै सकियो। मेनु फेरि हेर्नुहोस्।',
    too_many: 'यो फोनबाट धेरै अर्डर भयो। कर्मचारीलाई सोध्नुहोस्।',
    network: 'इन्टरनेट छैन। जाँचेर फेरि प्रयास गर्नुहोस्।',
    unknown: 'केही गडबड भयो। फेरि प्रयास गर्नुहोस् वा कर्मचारीलाई सोध्नुहोस्।',
  },
};

const STRINGS: Record<Lang, Strings> = { en, ne };

export type Key = Exclude<keyof Strings, 'errors'>;

export function makeT(lang: Lang) {
  const numerals = lang === 'ne' ? 'deva' : 'latn';
  const s = STRINGS[lang];
  return {
    t: (key: Key, vars: Record<string, string | number> = {}) =>
      s[key].replace(/\{(\w+)\}/gu, (_, k: string) => localizeDigits(String(vars[k] ?? ''), numerals)),
    error: (code: GuestError) => s.errors[code],
    money: (paisa: number) => formatMoney(paisa, { lang, numerals }),
    digits: (n: number) => localizeDigits(String(n), numerals),
    name: (r: Named) => (lang === 'ne' ? (r.name_ne ?? r.name_en) : (r.name_en ?? r.name_ne)) ?? '',
  };
}
