import { NextRequest, NextResponse } from "next/server"
import { eurSpoken } from "@/lib/voice-format"

/**
 * mortgage_estimate — estimate a monthly payment. Pure math, no database.
 *
 *   GET /api/voice/mortgage?price=20000000&down_payment=4000000&annual_rate=20&years=20
 *
 * Only `price` is required. Sensible defaults are used for the rest so the agent
 * can give a quick figure even with partial info. This is an ESTIMATE, not an
 * offer — the agent should say so.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const price = Number(sp.get("price"))
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "Provide a positive 'price' in EUR (euros)." }, { status: 400 })
  }

  const downPayment = Math.max(0, Number(sp.get("down_payment")) || 0)
  const annualRate = Number(sp.get("annual_rate"))
  const rate = Number.isFinite(annualRate) && annualRate >= 0 ? annualRate : 20 // % default
  const yearsRaw = Number(sp.get("years"))
  const years = Number.isFinite(yearsRaw) && yearsRaw > 0 ? yearsRaw : 20 // default term

  const principal = Math.max(0, price - downPayment)
  const months = Math.round(years * 12)
  const r = rate / 100 / 12 // monthly rate

  // Standard amortization; handle the 0% edge case.
  const monthly =
    r === 0 ? principal / months : (principal * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)

  const monthlyRounded = Math.round(monthly)
  const totalPaid = Math.round(monthlyRounded * months)
  const totalInterest = Math.max(0, totalPaid - principal)

  return NextResponse.json({
    inputs: { price_eur: price, down_payment_eur: downPayment, annual_rate_percent: rate, years },
    loan_amount_eur: principal,
    monthly_payment_eur: monthlyRounded,
    monthly_payment_spoken: `${eurSpoken(monthlyRounded)} euros per month`,
    total_paid_eur: totalPaid,
    total_interest_eur: totalInterest,
    spoken_summary:
      `On a ${eurSpoken(price)} euros property with ${eurSpoken(downPayment)} euros down, ` +
      `a ${years}-year loan at ${rate}% would be roughly ${eurSpoken(monthlyRounded)} euros per month. ` +
      `This is only an estimate.`,
    disclaimer: "Estimate only — actual terms depend on the bank and the buyer's profile.",
  })
}
