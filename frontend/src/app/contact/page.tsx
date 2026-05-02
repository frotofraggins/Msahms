import type { Metadata } from 'next';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact MesaHomes — Mesa, AZ Real Estate',
  description: 'Get in touch with MesaHomes. Email sales@mesahomes.com or send a message through our contact form. 24-hour response time.',
  alternates: { canonical: 'https://mesahomes.com/contact' },
};

export default function ContactPage() {
  return <ContactClient />;
}
