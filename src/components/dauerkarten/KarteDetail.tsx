'use client'

// Detailansicht einer Dauerkarte: Kartenfelder, Inhaberdaten, Zahlung
// nachtragen, Quittung, Ausgabe zurücknehmen, Karte löschen.
// Feldgruppen-Farbsystem: stammdaten = Karte, kontakt = Inhaber, geld = Zahlung.

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { gruppenRahmen, gruppenTitel } from '@/components/ui'
import {
  DK_ANREDEN,
  DK_ANREDE_LABELS,
  DK_KATEGORIEN,
  DK_KATEGORIE_LABELS,
  DK_SPAETER_LABELS,
  DK_SPAETER_WEGE,
  DK_ZAHLARTEN,
  DK_ZAHLART_LABELS,
} from '@/lib/dauerkarten-felder'
import { Karte, datumKurz, euro, inhaberName, kartennummerAnzeige, zahlbetragKarte } from './typen'

const eingabe = 'bg-gray-50 mt-0.5 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm'
const label = 'text-[10px] font-semibold text-gray-500 uppercase'

export function KarteDetail({
  karte,
  verteilerListe,
  onAktualisiert,
  onSchliessen,
  onAusgabe,
}: {
  karte: Karte
  verteilerListe: string[]
  onAktualisiert: () => Promise<void>
  onSchliessen: () => void
  onAusgabe: (karte: Karte) => void
}) {
  // Karte
  const [lfdNr, setLfdNr] = useState(String(karte.lfdNr))
  const [kartennummer, setKartennummer] = useState(karte.kartennummer)
  const [kategorie, setKategorie] = useState(karte.kategorie)
  const [preis, setPreis] = useState(String(karte.preis))
  const [abweichung, setAbweichung] = useState(karte.abweichung ? String(karte.abweichung) : '')
  const [verteiler, setVerteiler] = useState(karte.verteiler)
  const [bemerkung, setBemerkung] = useState(karte.bemerkung)
  const [gedruckt, setGedruckt] = useState(karte.gedruckt)
  // Inhaber
  const [vorname, setVorname] = useState(karte.inhaber.vorname)
  const [nachname, setNachname] = useState(karte.inhaber.nachname)
  const [anrede, setAnrede] = useState(karte.inhaber.anrede)
  const [rentner, setRentner] = useState(karte.inhaber.rentner)
  const [behinderung, setBehinderung] = useState(karte.inhaber.behinderung)
  const [info, setInfo] = useState(karte.inhaber.info)
  const [keineKarteMehr, setKeineKarteMehr] = useState(karte.inhaber.keineKarteMehr)
  // Zahlung
  const [zahlart, setZahlart] = useState(karte.zahlart)
  const [transaktionsNr, setTransaktionsNr] = useState(karte.transaktionsNr)
  const [spaeterWeg, setSpaeterWeg] = useState(karte.zahlungSpaeterUeber)

  const [fehler, setFehler] = useState<string | null>(null)
  const [meldung, setMeldung] = useState<string | null>(null)
  const [laeuft, setLaeuft] = useState(false)

  const anfrage = async (url: string, methode: string, body?: unknown) => {
    const res = await fetch(url, {
      method: methode,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || 'Aktion fehlgeschlagen')
    }
  }

  const speichern = async () => {
    setFehler(null)
    setMeldung(null)
    setLaeuft(true)
    try {
      await anfrage(`/api/dauerkarten/karten/${karte.id}`, 'PUT', {
        lfdNr, kartennummer, kategorie, preis, abweichung, verteiler, bemerkung, gedruckt,
      })
      await anfrage(`/api/dauerkarten/inhaber/${karte.inhaberId}`, 'PUT', {
        vorname, nachname, anrede, rentner, behinderung, info, keineKarteMehr,
      })
      // Nur-Druck-Karten haben keine Zahlung
      if (kategorie !== 'druck') {
        await anfrage(`/api/dauerkarten/karten/${karte.id}/zahlung`, 'PUT',
          zahlart
            ? { zahlart, transaktionsNr: zahlart === 'pos' ? transaktionsNr : '', zahlungSpaeterUeber: '' }
            : { zahlart: '', transaktionsNr: '', zahlungSpaeterUeber: spaeterWeg },
        )
      }
      setMeldung('Gespeichert.')
      await onAktualisiert()
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
    } finally {
      setLaeuft(false)
    }
  }

  const ausgabeZuruecknehmen = async () => {
    if (!confirm('Ausgabe wirklich zurücknehmen? Signatur und Quittung werden gelöscht.')) return
    setFehler(null)
    try {
      await anfrage(`/api/dauerkarten/karten/${karte.id}/ausgabe`, 'DELETE')
      await onAktualisiert()
      onSchliessen()
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Aktion fehlgeschlagen')
    }
  }

  const loeschen = async () => {
    const hinweis = karte.status === 'ausgegeben'
      ? 'Karte ist bereits ausgegeben — beim Löschen gehen Signatur und Quittung verloren. Wirklich löschen?'
      : 'Karte wirklich löschen?'
    if (!confirm(hinweis)) return
    setFehler(null)
    try {
      await anfrage(`/api/dauerkarten/karten/${karte.id}`, 'DELETE')
      await onAktualisiert()
      onSchliessen()
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Löschen fehlgeschlagen')
    }
  }

  return (
    <Modal
      isOpen
      onClose={onSchliessen}
      title={`Karte ${kartennummerAnzeige(karte)} — ${inhaberName(karte.inhaber)}`}
    >
      {/* Status / Ausgabe */}
      <div className="mb-4">
        {karte.status === 'ausgegeben' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-sm">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-semibold text-emerald-800">
                ✓ Ausgegeben am {datumKurz(karte.ausgabeDatum)}
                {karte.ohneSignatur ? ' (ohne elektronische Signatur)' : ''}
              </span>
              <span className="flex gap-2">
                {karte.pdfPfad && (
                  <a
                    href={`/api/dauerkarten/karten/${karte.id}/quittung`}
                    target="_blank"
                    className="text-xs font-semibold bg-yellow-500 text-gray-900 px-3 py-1.5 rounded-lg"
                  >
                    Quittung (PDF)
                  </a>
                )}
                <button
                  onClick={ausgabeZuruecknehmen}
                  className="text-xs font-medium text-gray-600 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                  title="Nur mit Verwalten-Rolle möglich"
                >
                  Zurücknehmen
                </button>
              </span>
            </div>
            {karte.hash && (
              <div className="text-[10px] text-emerald-700 font-mono mt-1 break-all">SHA-256: {karte.hash}</div>
            )}
          </div>
        ) : karte.kategorie !== 'druck' ? (
          <button
            onClick={() => onAusgabe(karte)}
            className="w-full text-sm font-semibold bg-gray-900 text-white px-4 py-2.5 rounded-lg"
          >
            → Ausgabe starten (Zahlung + Signatur)
          </button>
        ) : (
          <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-xs text-purple-700">
            Nur-Druck-Karte (Kinder, Ehrengäste …) — keine Zahlung, keine Ausgabe-Quittung.
          </div>
        )}
      </div>

      {/* Karte */}
      <div className={gruppenRahmen.stammdaten}>
        <p className={gruppenTitel.stammdaten}>Karte</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className={label}>Lfd. Nummer</span>
            <input value={lfdNr} onChange={e => setLfdNr(e.target.value)} inputMode="numeric" className={eingabe} />
          </label>
          <label className="block">
            <span className={label}>Kartennummer (Aufdruck)</span>
            <input value={kartennummer} onChange={e => setKartennummer(e.target.value)} className={eingabe} />
          </label>
          <label className="block">
            <span className={label}>Kategorie</span>
            <select value={kategorie} onChange={e => setKategorie(e.target.value)} className={eingabe}>
              {DK_KATEGORIEN.map(k => (
                <option key={k} value={k}>{DK_KATEGORIE_LABELS[k]}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Verteiler</span>
            <select value={verteiler} onChange={e => setVerteiler(e.target.value)} className={eingabe}>
              <option value="">—</option>
              {!verteilerListe.includes(verteiler) && verteiler && <option value={verteiler}>{verteiler}</option>}
              {verteilerListe.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Preis (€)</span>
            <input value={preis} onChange={e => setPreis(e.target.value)} inputMode="decimal" className={eingabe} />
          </label>
          <label className="block">
            <span className={label}>Abweichung ± (Spende/Abzug)</span>
            <input value={abweichung} onChange={e => setAbweichung(e.target.value)} placeholder="0" inputMode="decimal" className={eingabe} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700 mt-2">
          <input type="checkbox" checked={gedruckt} onChange={e => setGedruckt(e.target.checked)} className="rounded accent-yellow-500" />
          Karte ist gedruckt
        </label>
      </div>

      {/* Inhaber */}
      <div className={`${gruppenRahmen.kontakt} mt-3`}>
        <p className={gruppenTitel.kontakt}>Inhaber</p>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className={label}>Vorname</span>
            <input value={vorname} onChange={e => setVorname(e.target.value)} className={eingabe} />
          </label>
          <label className="block">
            <span className={label}>Nachname</span>
            <input value={nachname} onChange={e => setNachname(e.target.value)} className={eingabe} />
          </label>
          <label className="block">
            <span className={label}>Anrede</span>
            <select value={anrede} onChange={e => setAnrede(e.target.value)} className={eingabe}>
              <option value="">—</option>
              {DK_ANREDEN.map(a => (
                <option key={a} value={a}>{DK_ANREDE_LABELS[a]}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-3 pb-1 text-sm text-gray-700">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={rentner} onChange={e => setRentner(e.target.checked)} className="rounded accent-yellow-500" />
              Rentner
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={behinderung} onChange={e => setBehinderung(e.target.checked)} className="rounded accent-yellow-500" />
              Behinderung
            </label>
          </div>
        </div>
        <label className="block mt-2">
          <span className={label}>Info (z.B. „Freundin von …&quot;)</span>
          <input value={info} onChange={e => setInfo(e.target.value)} className={eingabe} />
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700 mt-2">
          <input type="checkbox" checked={keineKarteMehr} onChange={e => setKeineKarteMehr(e.target.checked)} className="rounded accent-yellow-500" />
          Nächste Saison <strong>keine Dauerkarte mehr</strong> (verstorben, kein Interesse)
        </label>
      </div>

      {/* Zahlung */}
      {kategorie !== 'druck' && (
        <div className={`${gruppenRahmen.geld} mt-3`}>
          <p className={gruppenTitel.geld}>Zahlung</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className={label}>Zahlart</span>
              <select value={zahlart} onChange={e => setZahlart(e.target.value)} className={eingabe}>
                <option value="">— offen —</option>
                {DK_ZAHLARTEN.map(z => (
                  <option key={z} value={z}>{DK_ZAHLART_LABELS[z]}</option>
                ))}
              </select>
            </label>
            {zahlart === 'pos' ? (
              <label className="block">
                <span className={label}>POS-Transaktionsnummer</span>
                <input value={transaktionsNr} onChange={e => setTransaktionsNr(e.target.value)} className={eingabe} />
              </label>
            ) : !zahlart ? (
              <label className="block">
                <span className={label}>Zahlung später über</span>
                <select value={spaeterWeg} onChange={e => setSpaeterWeg(e.target.value)} className={eingabe}>
                  <option value="">—</option>
                  {DK_SPAETER_WEGE.map(w => (
                    <option key={w} value={w}>{DK_SPAETER_LABELS[w]}</option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="flex items-end pb-1.5 text-sm text-gray-500">
                Zahlbetrag: <span className="font-semibold text-gray-900 ml-1">{euro(zahlbetragKarte({ preis: parseFloat(preis.replace(',', '.')) || 0, abweichung: parseFloat(abweichung.replace(',', '.')) || 0, zahlart }))}</span>
              </div>
            )}
          </div>
          {karte.bezahlt && karte.bezahltAm && (
            <p className="text-xs text-gray-500 mt-1.5">Bezahlt am {datumKurz(karte.bezahltAm)}</p>
          )}
        </div>
      )}

      {/* Bemerkung */}
      <div className={`${gruppenRahmen.status} mt-3`}>
        <p className={gruppenTitel.status}>Bemerkung</p>
        <input value={bemerkung} onChange={e => setBemerkung(e.target.value)} className={eingabe} placeholder="interne Notiz zur Karte" />
      </div>

      {meldung && <p className="text-xs text-emerald-700 mt-3">{meldung}</p>}
      {fehler && <p className="text-xs text-red-600 mt-3">{fehler}</p>}

      <div className="flex gap-2 mt-4">
        <button
          onClick={loeschen}
          className="text-xs font-medium text-red-600 border border-red-200 px-3 py-2 rounded-lg hover:bg-red-50"
        >
          Löschen
        </button>
        <button
          onClick={speichern}
          disabled={laeuft}
          className="flex-1 text-sm font-semibold bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {laeuft ? 'Speichere…' : 'Speichern'}
        </button>
      </div>
    </Modal>
  )
}
