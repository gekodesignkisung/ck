'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('craken_user');
    if (user) router.push('/workspaces');
  }, [router]);

  const handleGoogleLogin = () => {
    localStorage.setItem('craken_user', JSON.stringify({
      name: 'Kisung',
      email: 'kisung@corca.ai',
    }));
    router.push('/workspaces');
  };

  return (
    <div className="flex items-center justify-center h-screen" style={{ background: '#F2F8FF' }}>
      <div className="flex flex-col items-center gap-10">
        <div className="flex items-center gap-10">
          <Image src="craken-logo-v.svg" alt="Craken" width={320} height={460}/>

        </div>
        <button
          onClick={handleGoogleLogin}
          className="flex items-center gap-3 bg-white rounded-full px-6 py-3 text-[14px] font-medium text-[#3c4043] hover:shadow-md transition-all shadow-sm hover:bg-[#f8f8f8]"
        >
          <GoogleIcon />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path fill="#4285F4" d="M17.64 9.2045c0-.6381-.0573-1.2518-.1636-1.8409H9v3.4814h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087c1.7018-1.5668 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8064.54-1.8368.859-3.0477.859-2.3441 0-4.328-1.584-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71C3.784 10.17 3.682 9.5932 3.682 9c0-.5932.1018-1.17.2818-1.71V4.9582H.9574C.3477 6.1731 0 7.5477 0 9c0 1.4523.3477 2.8268.9574 4.0418L3.964 10.71z" />
      <path fill="#EA4335" d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.672 5.1636 6.6559 3.5795 9 3.5795z" />
    </svg>
  );
}
