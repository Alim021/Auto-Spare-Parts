import Navbar from '../components/Navbar'; // path adjust karo
import '../styles/navbar.css'; // global styles

function MyApp({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
