import { ConnectButton } from '@rainbow-me/rainbowkit';
import '../styles/Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <div>
              <h1 className="header-title">Silent Kingdoms</h1>
              <p className="header-subtitle">Encrypted strategy built on Zama FHE</p>
            </div>
          </div>
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
