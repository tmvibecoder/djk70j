'use client'

// 3-Schritte-Ausgabe-Flow (Mockup-Variante B, „Sportplatz-Modus"):
// 1 Karte & Preis prüfen → 2 Zahlung (inkl. POS-Transaktionsnummer und
// „Zahlung erfolgt später über …") → 3 Finger-Signatur ODER Haken „ohne
// elektronische Signatur" (Papier-Ausgabe über die Verteilerliste).
// Ablauf im Hintergrund: PUT Karte → PUT Zahlung → POST Ausgabe.

import { useRef, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { SignaturPad, SignaturPadHandle } from '@/components/schluessel/SignaturPad'
import {
  DK_SPAETER_LABELS,
  DK_SPAETER_WEGE,
  DK_ZAHLART_LABELS,
} from '@/lib/dauerkarten-felder'
import { Karte, euro, inhaberName, kartennummerAnzeige } from './typen'

const ZAHL_BUTTONS: { wert: string; label: string; icon: string }[] = [
  { wert: 'bar', label: 'Bar', icon: '💶' },
  { wert: 'pos', label: 'POS', icon: '💳' },
  { wert: 'ueberweisung', label: 'Überweisung', icon: '🏦' },
  { wert: 'paypal', label: 'PayPal', icon: '🅿️' },
  { wert: 'geschenk', label: 'Geschenk', icon: '🎁' },
  { wert: '__spaeter', label: 'später …', icon: '⏳' },
]

export function AusgabeFlow({
  karte,
  verteilerListe,
  onFertig,
  onSchliessen,
}: {
  karte: Karte
  verteilerListe: string[]
  onFertig: () => void
  onSchliessen: () => void
}) {
  const [preis, setPreis] = useState(String(karte.preis))
  const [abweichung, setAbweichung] = useState(karte.abweichung ? String(karte.abweichung) : '')
  const [verteiler, setVerteiler] = useState(karte.verteiler || verteilerListe[0] || '')
  // Zahlung: vorhandene Erfassung übernehmen
  const [zahlart, setZahlart] = useState(
    karte.zahlart ? karte.zahlart : karte.zahlungSpaeterUeber ? '__spaeter' : '',
  )
  const [transaktionsNr, setTransaktionsNr] = useState(karte.transaktionsNr)
  const [spaeterWeg, setSpaeterWeg] = useState(karte.zahlungSpaeterUeber || 'bar')
  const [ohneSignatur, setOhneSignatur] = useState(false)
  const [laeuft, setLaeuft] = useState(false)
  const [fehler, setFehler] = useState<string | null>(null)
  const [ergebnis, setErgebnis] = useState<{ hash: string | null } | null>(null)
  const pad = useRef<SignaturPadHandle>(null)

  const abschicken = async () => {
    const unterschrift = pad.current?.getDataUrl()
    if (!zahlart) {
      setFehler('Bitte eine Zahlart wählen (oder „später").')
      return
    }
    if (!ohneSignatur && !unterschrift) {
      setFehler('Bitte unterschreiben lassen — oder „ohne elektronische Signatur" ankreuzen.')
      return
    }
    setFehler(null)
    setLaeuft(true)
    try {
      // 1. Kartenfelder (Preis/Abweichung/Verteiler) speichern — kompletter
      // Feldsatz, unveränderte Werte kommen aus der Karte selbst
      const karteRes = await fetch(`/api/dauerkarten/karten/${karte.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lfdNr: karte.lfdNr,
          kartennummer: karte.kartennummer,
          kategorie: karte.kategorie,
          preis,
          abweichung,
          verteiler,
          bemerkung: karte.bemerkung,
          gedruckt: karte.gedruckt,
        }),
      })
      if (!karteRes.ok) {
        const j = await karteRes.json().catch(() => ({}))
        throw new Error(j.error || 'Karte speichern fehlgeschlagen')
      }
      // 2. Zahlung erfassen
      const zahlungRes = await fetch(`/api/dauerkarten/karten/${karte.id}/zahlung`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          zahlart === '__spaeter'
            ? { zahlart: '', zahlungSpaeterUeber: spaeterWeg, transaktionsNr: '' }
            : { zahlart, transaktionsNr: zahlart === 'pos' ? transaktionsNr : '', zahlungSpaeterUeber: '' },
        ),
      })
      if (!zahlungRes.ok) {
        const j = await zahlungRes.json().catch(() => ({}))
        throw new Error(j.error || 'Zahlung erfassen fehlgeschlagen')
      }
      // 3. Ausgabe (Signatur oder Papier-Vermerk)
      const ausgabeRes = await fetch(`/api/dauerkarten/karten/${karte.id}/ausgabe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ohneSignatur ? { ohneSignatur: true } : { unterschrift }),
      })
      const ausgabe = await ausgabeRes.json()
      if (!ausgabeRes.ok) throw new Error(ausgabe.error || 'Ausgabe fehlgeschlagen')
      setErgebnis({ hash: ausgabe.hash ?? null })
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Fehler bei der Ausgabe')
    } finally {
      setLaeuft(false)
    }
  }

  const schrittTitel = (nr: number, titel: string) => (
    <div className="flex items-center gap-2 mb-2">
      <span className="bg-yellow-400 text-gray-900 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0">
        {nr}
      </span>
      <h3 className="font-semibold text-gray-900 text-sm">{titel}</h3>
    </div>
  )

  if (ergebnis) {
    return (
      <Modal isOpen onClose={onFertig} title="Karte ausgegeben">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-emerald-800">
            ✅ Karte {kartennummerAnzeige(karte)} an {inhaberName(karte.inhaber)} ausgegeben
          </div>
          {ergebnis.hash ? (
            <div className="text-[10px] text-emerald-700 font-mono mt-1 break-all">SHA-256: {ergebnis.hash}</div>
          ) : (
            <div className="text-xs text-emerald-700 mt-1">
              Ohne elektronische Signatur — Unterschrift bitte auf der Papier-Ausgabeliste einholen.
            </div>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          {ergebnis.hash && (
            <a
              href={`/api/dauerkarten/karten/${karte.id}/quittung`}
              target="_blank"
              className="flex-1 text-center text-sm font-semibold bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg"
            >
              Quittung (PDF) öffnen
            </a>
          )}
          <button
            onClick={onFertig}
            className="flex-1 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
          >
            Fertig
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen
      onClose={onSchliessen}
      title={`Ausgabe — Karte ${kartennummerAnzeige(karte)} an ${inhaberName(karte.inhaber)}`}
    >
      {/* Schritt 1: Karte & Preis */}
      <div className="border-b border-gray-100 pb-4">
        {schrittTitel(1, 'Karte & Preis prüfen')}
        <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500">Preis</span>
            <span className="flex items-center gap-1">
              <input
                value={preis}
                onChange={e => setPreis(e.target.value)}
                inputMode="decimal"
                className="bg-white w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm text-right"
              />
              <span className="text-gray-500">€</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500">Abweichung (± Spende/Abzug)</span>
            <span className="flex items-center gap-1">
              <input
                value={abweichung}
                onChange={e => setAbweichung(e.target.value)}
                placeholder="0"
                inputMode="decimal"
                className="bg-white w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm text-right"
              />
              <span className="text-gray-500">€</span>
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-gray-500">Ausgegeben durch</span>
            <select
              value={verteiler}
              onChange={e => setVerteiler(e.target.value)}
              className="bg-white rounded-lg border border-gray-300 px-2 py-1 text-sm"
            >
              {!verteilerListe.includes(verteiler) && verteiler && (
                <option value={verteiler}>{verteiler}</option>
              )}
              {verteilerListe.map(v => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Schritt 2: Zahlung */}
      <div className="border-b border-gray-100 py-4">
        {schrittTitel(2, 'Zahlung')}
        <div className="grid grid-cols-3 gap-2">
          {ZAHL_BUTTONS.map(z => (
            <button
              key={z.wert}
              onClick={() => setZahlart(z.wert)}
              className={`border rounded-lg py-2 text-xs font-medium ${
                zahlart === z.wert
                  ? 'border-gray-900 bg-yellow-50 text-gray-900'
                  : z.wert === '__spaeter'
                    ? 'border-dashed border-red-300 text-red-600'
                    : 'border-gray-200 text-gray-600'
              }`}
            >
              <span className="block text-base leading-none mb-0.5">{z.icon}</span>
              {z.label}
            </button>
          ))}
        </div>
        {zahlart === 'pos' && (
          <input
            value={transaktionsNr}
            onChange={e => setTransaktionsNr(e.target.value)}
            placeholder="Transaktionsnummer vom POS-Gerät"
            className="bg-gray-50 mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        )}
        {zahlart === '__spaeter' && (
          <div className="mt-2">
            <select
              value={spaeterWeg}
              onChange={e => setSpaeterWeg(e.target.value)}
              className="bg-gray-50 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {DK_SPAETER_WEGE.map(w => (
                <option key={w} value={w}>
                  Zahlung erfolgt später über: {DK_SPAETER_LABELS[w]}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-400 mt-1">
              Steht genau so auf der Quittung — die Karte bleibt als „offen&quot; markiert.
            </p>
          </div>
        )}
        {zahlart && zahlart !== '__spaeter' && zahlart !== 'geschenk' && (
          <p className="text-xs text-gray-500 mt-2">
            Zahlbetrag:{' '}
            <span className="font-semibold text-gray-900">
              {euro((parseFloat(preis.replace(',', '.')) || 0) + (parseFloat(abweichung.replace(',', '.')) || 0))}
            </span>{' '}
            ({DK_ZAHLART_LABELS[zahlart as keyof typeof DK_ZAHLART_LABELS]})
          </p>
        )}
      </div>

      {/* Schritt 3: Signatur */}
      <div className="pt-4">
        {schrittTitel(3, 'Empfang quittieren')}
        {!ohneSignatur && <SignaturPad ref={pad} />}
        <label className="flex items-center gap-2 text-sm text-gray-600 mt-3">
          <input
            type="checkbox"
            checked={ohneSignatur}
            onChange={e => setOhneSignatur(e.target.checked)}
            className="rounded accent-yellow-500"
          />
          Karte wird <strong>ohne elektronische Signatur</strong> ausgegeben (Papierliste)
        </label>
        {fehler && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mt-3">
            {fehler}
          </div>
        )}
        <div className="flex gap-2 mt-3">
          {!ohneSignatur && (
            <button
              onClick={() => pad.current?.clear()}
              className="text-xs font-medium bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg"
              title="Unterschrift löschen"
            >
              🗑️
            </button>
          )}
          <button
            onClick={abschicken}
            disabled={laeuft}
            className="flex-1 text-sm font-semibold bg-gray-900 text-white px-4 py-2.5 rounded-lg disabled:opacity-50"
          >
            {laeuft ? 'Speichere…' : '✓ Karte ausgeben & Quittung erzeugen'}
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2">
          Mit der Unterschrift wird die Empfangsbestätigung erzeugt, mit einer SHA-256-Prüfsumme
          versiegelt und als PDF abgelegt (wie bei der Schlüsselausgabe).
        </p>
      </div>
    </Modal>
  )
}
