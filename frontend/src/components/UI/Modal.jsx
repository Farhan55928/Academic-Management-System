import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MdClose } from 'react-icons/md';

export default function Modal({ title, onClose, children, footer, premium = false }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  const overlayClass = premium ? 'glass-overlay' : 'modal-overlay';
  const modalClass = premium ? 'glass-modal' : 'modal';
  const headerClass = premium ? 'glass-modal-header' : 'modal-header';
  const closeClass = premium ? 'glass-modal-close' : 'modal-close';
  const bodyClass = premium ? 'glass-modal-body' : 'modal-body';
  const footerClass = premium ? 'glass-modal-footer' : 'modal-footer';

  return createPortal(
    <div className={overlayClass} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${modalClass} anim-scale-in`}>
        <div className={headerClass}>
          {premium ? (
             <div>
               <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(96,165,250,0.8)', marginBottom: 4 }}>Action Required</p>
               <h3>{title}</h3>
             </div>
          ) : (
            <h3>{title}</h3>
          )}
          <button className={closeClass} onClick={onClose}><MdClose /></button>
        </div>
        <div className={bodyClass}>{children}</div>
        {footer && <div className={footerClass}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
