import { useState, useEffect } from 'react';
import { supabase, Business } from './lib/supabase';
import { Auth } from './components/Auth';
import { BusinessList } from './components/BusinessList';
import { NotesView } from './components/NotesView';

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSelectedBusiness(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Cargando...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (selectedBusiness) {
    return (
      <NotesView
        business={selectedBusiness}
        onBack={() => setSelectedBusiness(null)}
      />
    );
  }

  return (
    <BusinessList
      onSelectBusiness={setSelectedBusiness}
      onSignOut={handleSignOut}
    />
  );
}

export default App;
