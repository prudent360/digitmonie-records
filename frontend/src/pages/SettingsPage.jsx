import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, Image, CheckCircle } from 'lucide-react';
import api from '../lib/api';
import Toast from '../components/Toast';

export default function SettingsPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('dm_user') || '{}');
  const fileInputRef = useRef(null);

  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  // Redirect non-admin users
  useEffect(() => {
    if (user.role !== 'admin') navigate('/', { replace: true });
  }, [user.role, navigate]);

  // Load current settings
  useEffect(() => {
    api.getSettings().then(res => {
      if (res.settings?.logo) {
        setLogo(res.settings.logo);
        setPreview(res.settings.logo);
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const processFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setToast({ message: 'Please upload an image file (PNG, JPG, SVG)', type: 'error' });
      return;
    }
    if (file.size > 500000) {
      setToast({ message: 'Image must be smaller than 500KB', type: 'error' });
      return;
    }

    // Resize to max 200x200
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 200;
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
          else { w = Math.round(w * maxSize / h); h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/png', 0.9);
        setPreview(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleFileChange = (e) => {
    processFile(e.target.files[0]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings({ logo: preview || '' });
      if (preview) {
        localStorage.setItem('dm_logo', preview);
      } else {
        localStorage.removeItem('dm_logo');
      }
      setLogo(preview);
      setToast({ message: 'Settings saved successfully!', type: 'success' });
      // Trigger re-render of sidebar/layout
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
  };

  const hasChanges = logo !== preview;

  const btnBase = "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-medium border-none transition-all duration-200 whitespace-nowrap cursor-pointer";
  const btnPrimary = `${btnBase} px-5 py-2.5 bg-primary-600 text-white hover:bg-primary-700 hover:shadow-[0_4px_12px_rgba(2,132,199,0.2)]`;

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-3 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div></div>;

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4 max-md:flex-col max-md:items-start">
        <div>
          <h1 className="text-[26px] font-bold text-text-primary tracking-tight leading-[1.2] max-md:text-[22px] max-sm:text-xl">Settings</h1>
          <p className="text-sm text-text-muted mt-1">Manage your brand and preferences</p>
        </div>
      </div>

      <div className="max-w-[640px]">
        {/* Brand Logo Section */}
        <div className="bg-surface border border-border rounded-lg p-7 mb-6 max-md:p-5 max-sm:p-4">
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-border">
            <div className="w-10 h-10 rounded-[10px] bg-primary-50 text-primary-500 flex items-center justify-center">
              <Image size={20} />
            </div>
            <div>
              <h3 className="text-base font-semibold text-text-primary">Brand Logo</h3>
              <p className="text-[13px] text-text-muted mt-0.5">Upload your logo to customize the app appearance</p>
            </div>
          </div>

          <div className="flex items-start gap-8 max-md:flex-col max-md:gap-6">
            {/* Preview */}
            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="w-[120px] h-[120px] rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center overflow-hidden">
                {preview ? (
                  <img src={preview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-text-muted text-center">
                    <Image size={32} className="mx-auto opacity-30 mb-1" />
                    <span className="text-[11px] font-medium">No logo</span>
                  </div>
                )}
              </div>
              {preview && (
                <button className={`${btnBase} px-3 py-1.5 text-xs bg-transparent text-red-500 border border-red-200 hover:bg-red-50`} onClick={handleRemove}>
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>

            {/* Upload Area */}
            <div className="flex-1 w-full">
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 max-md:p-6 ${dragOver ? 'border-primary-400 bg-primary-50/50' : 'border-border hover:border-primary-300 hover:bg-primary-50/20'}`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={handleFileChange} />
                <Upload size={28} className={`mx-auto mb-3 ${dragOver ? 'text-primary-500' : 'text-text-muted'}`} />
                <p className="text-sm font-medium text-text-secondary mb-1">
                  {dragOver ? 'Drop image here' : 'Click or drag & drop'}
                </p>
                <p className="text-xs text-text-muted">PNG, JPG, SVG or WebP • Max 500KB • Resized to 200×200</p>
              </div>

              <div className="mt-4 bg-muted rounded-lg p-4 border border-border">
                <p className="text-[13px] text-text-secondary font-medium mb-2">Where your logo appears:</p>
                <ul className="text-[13px] text-text-muted space-y-1.5">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-success shrink-0" /> Sidebar brand area</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-success shrink-0" /> Mobile top header</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-success shrink-0" /> Login page</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action */}
          {hasChanges && (
            <div className="flex items-center justify-between mt-7 pt-5 border-t border-border max-md:flex-col max-md:gap-3">
              <p className="text-[13px] text-amber-600 font-medium">You have unsaved changes</p>
              <div className="flex gap-3 max-md:w-full">
                <button className={`${btnBase} px-5 py-2.5 bg-muted text-text-primary border border-border hover:bg-border max-md:flex-1`} onClick={() => setPreview(logo)}>Discard</button>
                <button className={`${btnPrimary} max-md:flex-1`} onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
