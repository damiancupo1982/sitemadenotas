import { useState, useEffect, useRef } from 'react';
import { supabase, Business, Note } from '../lib/supabase';
import {
  ArrowLeft,
  Mic,
  Image as ImageIcon,
  Video,
  Trash2,
  Upload,
  Square,
  Type
} from 'lucide-react';

interface NotesViewProps {
  business: Business;
  onBack: () => void;
}

export function NotesView({ business, onBack }: NotesViewProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingText, setRecordingText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');

  const recognitionRef = useRef<any>(null);
  const fileInputImageRef = useRef<HTMLInputElement>(null);
  const fileInputVideoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadNotes();

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (finalTranscript) {
          setRecordingText(prev => prev + finalTranscript);
        }
        setInterimText(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [business.id]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      setRecordingText('');
      setInterimText('');
      setIsRecording(true);
      recognitionRef.current.start();
    } else {
      alert('Lo siento, tu navegador no soporta reconocimiento de voz. Por favor usa Chrome o Edge.');
    }
  };

  const stopRecording = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);

    const fullText = (recordingText + ' ' + interimText).trim();
    setInterimText('');
    setRecordingText('');

    if (fullText) {
      await saveTextNote(fullText);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    await saveTextNote(textInput.trim());
    setTextInput('');
    setShowTextInput(false);
  };

  const saveTextNote = async (text: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('notes')
        .insert({
          business_id: business.id,
          type: 'text',
          content: text,
          user_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setNotes([data, ...notes]);
      }
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const uploadFile = async (file: File, type: 'image' | 'video') => {
    setUploadingFile(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('business-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('business-files')
        .getPublicUrl(fileName);

      const { data, error } = await supabase
        .from('notes')
        .insert({
          business_id: business.id,
          type,
          content: publicUrl,
          user_id: user.user.id
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setNotes([data, ...notes]);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error al subir el archivo');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file, type);
    }
  };

  const deleteNote = async (note: Note) => {
    if (!confirm('¿Estás seguro de eliminar esta nota?')) return;

    try {
      if (note.type === 'image' || note.type === 'video') {
        const urlParts = note.content.split('/');
        const fileName = urlParts.slice(-2).join('/');
        await supabase.storage.from('business-files').remove([fileName]);
      }

      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', note.id);

      if (error) throw error;
      setNotes(notes.filter(n => n.id !== note.id));
    } catch (error) {
      console.error('Error deleting note:', error);
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
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver a negocios
        </button>

        <h1 className="text-4xl font-bold text-slate-800 mb-8">{business.name}</h1>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Nueva Nota</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              disabled={uploadingFile || isRecording}
              className="flex flex-col items-center gap-3 p-6 rounded-lg bg-slate-600 hover:bg-slate-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Type className="w-8 h-8" />
              <span className="font-semibold">Escribir Texto</span>
              <span className="text-xs opacity-90">Nota manual</span>
            </button>

            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={uploadingFile || showTextInput}
              className={`flex flex-col items-center gap-3 p-6 rounded-lg transition ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isRecording ? (
                <>
                  <Square className="w-8 h-8 animate-pulse" />
                  <span className="font-semibold">Detener</span>
                  <div className="flex gap-1 items-center">
                    <span className="w-1 h-3 bg-white animate-pulse" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1 h-5 bg-white animate-pulse" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1 h-4 bg-white animate-pulse" style={{ animationDelay: '300ms' }}></span>
                    <span className="w-1 h-6 bg-white animate-pulse" style={{ animationDelay: '450ms' }}></span>
                    <span className="w-1 h-3 bg-white animate-pulse" style={{ animationDelay: '600ms' }}></span>
                  </div>
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8" />
                  <span className="font-semibold">Grabar Audio</span>
                  <span className="text-xs opacity-90">Transcribir voz</span>
                </>
              )}
            </button>

            <button
              onClick={() => fileInputImageRef.current?.click()}
              disabled={uploadingFile || isRecording || showTextInput}
              className="flex flex-col items-center gap-3 p-6 rounded-lg bg-green-600 hover:bg-green-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ImageIcon className="w-8 h-8" />
              <span className="font-semibold">Subir Imagen</span>
              <span className="text-xs opacity-90">Comprobante</span>
            </button>

            <button
              onClick={() => fileInputVideoRef.current?.click()}
              disabled={uploadingFile || isRecording || showTextInput}
              className="flex flex-col items-center gap-3 p-6 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Video className="w-8 h-8" />
              <span className="font-semibold">Subir Video</span>
              <span className="text-xs opacity-90">Clip de video</span>
            </button>

            <input
              ref={fileInputImageRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'image')}
              className="hidden"
            />
            <input
              ref={fileInputVideoRef}
              type="file"
              accept="video/*"
              onChange={(e) => handleFileUpload(e, 'video')}
              className="hidden"
            />
          </div>

          {showTextInput && (
            <form onSubmit={handleTextSubmit} className="mt-4">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Escribe tu nota aquí..."
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-500 focus:border-transparent outline-none resize-none"
                rows={4}
                autoFocus
              />
              <div className="flex gap-2 mt-3">
                <button
                  type="submit"
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition"
                >
                  Guardar Nota
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTextInput(false);
                    setTextInput('');
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 rounded-lg transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {isRecording && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border-2 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <p className="text-sm font-semibold text-red-900">Grabando...</p>
              </div>
              <p className="text-sm text-slate-700">
                {recordingText}
                <span className="text-slate-500 italic">{interimText}</span>
              </p>
            </div>
          )}

          {uploadingFile && (
            <div className="mt-4 p-4 bg-slate-100 rounded-lg text-center">
              <Upload className="w-6 h-6 mx-auto mb-2 text-slate-600 animate-bounce" />
              <p className="text-sm text-slate-600">Subiendo archivo...</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-800">Notas</h2>

          {notes.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <p className="text-slate-500">No hay notas todavía. Crea tu primera nota.</p>
            </div>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {note.type === 'text' && (
                        <p className="text-slate-700 whitespace-pre-wrap">{note.content}</p>
                      )}

                      {note.type === 'image' && (
                        <div>
                          <img
                            src={note.content}
                            alt="Comprobante"
                            className="max-w-full h-auto rounded-lg shadow-md"
                          />
                        </div>
                      )}

                      {note.type === 'video' && (
                        <div>
                          <video
                            src={note.content}
                            controls
                            className="max-w-full h-auto rounded-lg shadow-md"
                          />
                        </div>
                      )}

                      <p className="text-xs text-slate-400 mt-3">
                        {new Date(note.created_at).toLocaleString('es-AR')}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteNote(note)}
                      className="opacity-0 group-hover:opacity-100 transition p-2 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
