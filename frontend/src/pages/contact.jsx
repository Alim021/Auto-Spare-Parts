// @ts-nocheck
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import '../styles/contact.css';

export default function Contact() {
  return (
    <>
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
        <form className="contact-form space-y-4">
          <input type="text" placeholder="Your Name" />
          <input type="email" placeholder="Your Email" />
          <textarea placeholder="Your Message" className="h-32" />
          <button type="submit">Send</button>
        </form>
      </div>
      <Footer />
    </>
  );
}
