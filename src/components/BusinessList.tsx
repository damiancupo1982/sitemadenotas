import { useState, useEffect } from 'react';
import { supabase, Business } from '../lib/supabase';
import { Store, Plus, LogOut, X } from 'lucide-react';

interface BusinessListProps {
  onSelectBusiness: (business: Business) => void;
  onSignOut: () => void;
}

export function BusinessList({ onSelectBusiness, onSignOut }: BusinessListProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length === 0) {
        await initializeDefaultBusinesses();
      } else {
        setBusinesses(data || []);
      }
    } catch (error) {
      console.error('Error loading businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultBusinesses = async () => {
    const defaultBusinesses = [
      'San Benito',
      'San Isidro Labrador',
      'Gimnasio Apolo',
      'Círculo Sport'
    ];

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const businessesToInsert = defaultBusinesses.map(name => ({
        name,
        user_id: user.user.id
      }));

      const { data, error } = await supabase
        .from('businesses')
        .insert(businessesToInsert)
        .select();

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error('Error initializing businesses:', error);
    }
  };

  const handleAddBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName.trim()) return;

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('businesses')
        .insert({ name: newBusinessName, user_id: user.user.id })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setBusinesses([...businesses, data]);
        setNewBusinessName('');
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding business:', error);
    }
  };

  const handleDeleteBusiness = async (e: React.MouseEvent, businessId: string) => {
    e.stopPropagation();
    if (!confirm('¿Estás seguro de eliminar este negocio? Se eliminarán todas sus notas.')) return;

    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) throw error;
      setBusinesses(businesses.filter(b => b.id !== businessId));
    } catch (error) {
      console.error('Error deleting business:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-slate-600">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-slate-800">Mis Negocios</h1>
          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-white rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            Salir
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="relative bg-white hover:bg-slate-50 rounded-xl shadow-md hover:shadow-xl transition-all group"
            >
              <button
                onClick={(e) => handleDeleteBusiness(e, business.id)}
                className="absolute top-3 right-3 p-2 bg-red-100 hover:bg-red-200 rounded-full opacity-0 group-hover:opacity-100 transition z-10"
                title="Eliminar negocio"
              >
                <X className="w-4 h-4 text-red-600" />
              </button>
              <button
                onClick={() => onSelectBusiness(business)}
                className="w-full p-6 text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 group-hover:bg-blue-200 p-3 rounded-full transition">
                    <Store className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 group-hover:text-blue-600 transition">
                      {business.name}
                    </h3>
                    <p className="text-sm text-slate-500">Toca para ver notas</p>
                  </div>
                </div>
              </button>
            </div>
          ))}

          {showAddForm ? (
            <form onSubmit={handleAddBusiness} className="bg-white rounded-xl shadow-md p-6">
              <input
                type="text"
                value={newBusinessName}
                onChange={(e) => setNewBusinessName(e.target.value)}
                placeholder="Nombre del negocio"
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-3"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Agregar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewBusinessName('');
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md hover:shadow-xl transition-all p-6 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-500 group-hover:bg-blue-600 p-3 rounded-full transition">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Agregar Negocio
                  </h3>
                  <p className="text-sm text-blue-100">Crear nuevo negocio</p>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
