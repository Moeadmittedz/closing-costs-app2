
import React, { useState } from "react";

export default function ClosingCostsCalculator() {
  const [txType, setTxType] = useState("purchase");
  const [price, setPrice] = useState(750000);
  const [deposit, setDeposit] = useState(50000);
  const [mortgage, setMortgage] = useState(600000);
  const [commissionPct, setCommissionPct] = useState(5);
  const [isToronto, setIsToronto] = useState(false);
  const [isFirstTimeBuyer, setIsFirstTimeBuyer] = useState(false);
  const [propertyType, setPropertyType] = useState("resale");
  const [results, setResults] = useState(null);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fmt = (n) => {
    if (n === null || n === undefined || Number.isNaN(n)) return "—";
    return n.toLocaleString(undefined, { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
  };

  function calcOntarioLTT(purchasePrice) {
    let remaining = purchasePrice;
    let tax = 0;
    const brackets = [
      { limit: 55000, rate: 0.005 },
      { limit: 250000, rate: 0.01 },
      { limit: 400000, rate: 0.015 },
      { limit: 2400000, rate: 0.02 },
      { limit: Infinity, rate: 0.025 },
    ];
    let lowerBound = 0;
    for (let i = 0; i < brackets.length; i++) {
      const upper = brackets[i].limit;
      const amountInBracket = Math.max(0, Math.min(remaining, upper - lowerBound));
      if (amountInBracket <= 0) break;
      tax += amountInBracket * brackets[i].rate;
      lowerBound = upper;
    }
    return Math.round(tax);
  }

  function estimateRegistrationFees(hasMortgage) {
    const base = 200;
    const mortgageReg = hasMortgage ? 80 : 0;
    return base + mortgageReg;
  }

  function estimateTitleInsurance(purchasePrice) {
    if (purchasePrice <= 300000) return 250;
    if (purchasePrice <= 600000) return 350;
    if (purchasePrice <= 1000000) return 450;
    return 650;
  }

  function estimateLegalFee(txType) {
    if (txType === "purchase") return 1500;
    if (txType === "sale") return 1200;
    if (txType === "refinance") return 900;
    return 1200;
  }

  function estimateAdjustments(purchasePrice) {
    return Math.round(purchasePrice * 0.0025);
  }

  function calculatePurchase(inputs) {
    const { price, deposit, mortgage, isToronto, isFirstTimeBuyer } = inputs;
    const ontLTT = calcOntarioLTT(price);
    const torontoLTT = isToronto ? calcOntarioLTT(price) : 0;
    const ftbRebate = isFirstTimeBuyer ? Math.min(4000, ontLTT + torontoLTT) : 0;
    const regFees = estimateRegistrationFees(Boolean(mortgage));
    const titleInsurance = estimateTitleInsurance(price);
    const legalFee = estimateLegalFee("purchase");
    const adjustments = estimateAdjustments(price);
    const totalCosts = Math.round(ontLTT + torontoLTT - ftbRebate + regFees + titleInsurance + legalFee + adjustments);
    const cashRequired = Math.max(0, totalCosts - (deposit || 0));
    return { ontLTT, torontoLTT, ftbRebate, regFees, titleInsurance, legalFee, adjustments, totalCosts, cashRequired };
  }

  function calculateSale(inputs) {
    const { price, deposit, mortgage, commissionPct } = inputs;
    const commission = Math.round((commissionPct / 100) * price);
    const hstOnCommission = Math.round(commission * 0.13);
    const mortgagePayout = mortgage || 0;
    const legalFee = estimateLegalFee("sale");
    const totalDeductions = Math.round(commission + hstOnCommission + mortgagePayout + legalFee);
    const netProceeds = Math.round(price - totalDeductions + (deposit || 0));
    return { commission, hstOnCommission, mortgagePayout, legalFee, totalDeductions, netProceeds };
  }

  function calculateRefinance(inputs) {
    const { newMortgage, mortgage } = inputs;
    const legalFee = estimateLegalFee("refinance");
    const titleInsurance = estimateTitleInsurance(newMortgage || mortgage || 0);
    const regFees = estimateRegistrationFees(true);
    const payouts = mortgage || 0;
    const totalCosts = Math.round(legalFee + titleInsurance + regFees + payouts);
    const netAdvance = Math.round((newMortgage || 0) - totalCosts);
    return { legalFee, titleInsurance, regFees, payouts, totalCosts, netAdvance };
  }

  function handleCalculate(e) {
    e && e.preventDefault();
    const inputs = { price: Number(price || 0), deposit: Number(deposit || 0), mortgage: Number(mortgage || 0), commissionPct: Number(commissionPct || 0), isToronto, isFirstTimeBuyer, propertyType };
    if (txType === "purchase") setResults(calculatePurchase(inputs));
    if (txType === "sale") setResults(calculateSale(inputs));
    if (txType === "refinance") setResults(calculateRefinance({ ...inputs, newMortgage: Number(mortgage || 0) }));
  }

  async function handleEmail(e) {
    e && e.preventDefault();
    if (!email) { setMessage({ type: 'error', text: 'Please enter an email address.' }); return; }
    if (!results) { setMessage({ type: 'error', text: 'Please calculate results before emailing.' }); return; }

    setLoading(true);
    setMessage(null);

    const payload = {
      email,
      inputs: { txType, price, deposit, mortgage, commissionPct, isToronto, isFirstTimeBuyer, propertyType },
      results
    };

    try {
      const res = await fetch('/api/sendEstimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Estimate emailed — check your inbox (and Exilex will receive a copy).' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to send email.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to send email.' });
    }
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto p-2">
      <div className="p-4 rounded-lg">
        <h1 className="text-2xl font-semibold mb-4">Closing Costs Calculator</h1>

        <form onSubmit={handleCalculate} className="space-y-4 text-gray-200">
          <div className="flex gap-3">
            <label className="flex-1">
              <div className="text-sm text-gray-400">Transaction type</div>
              <select value={txType} onChange={(e) => setTxType(e.target.value)} className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-md">
                <option value="purchase">Purchase</option>
                <option value="sale">Sale</option>
                <option value="refinance">Refinance</option>
              </select>
            </label>

            <label className="w-1/3">
              <div className="text-sm text-gray-400">Property type</div>
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value)} className="w-full mt-1 p-2 bg-gray-800 border border-gray-700 rounded-md">
                <option value="resale">Resale</option>
                <option value="new">New build</option>
                <option value="condo">Condo</option>
              </select>
            </label>
          </div>

# write remainder of files after this cell

          <div className="grid grid-cols-3 gap-3">
            <label>
              <div className="text-sm text-gray-400">Purchase / Sale Price</div>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 p-2 w-full bg-gray-800 border border-gray-700 rounded-md" />
            </label>

            <label>
              <div className="text-sm text-gray-400">Deposit held in trust</div>
              <input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="mt-1 p-2 w-full bg-gray-800 border border-gray-700 rounded-md" />
            </label>

            <label>
              <div className="text-sm text-gray-400">Mortgage / Outstanding balance</div>
              <input type="number" value={mortgage} onChange={(e) => setMortgage(e.target.value)} className="mt-1 p-2 w-full bg-gray-800 border border-gray-700 rounded-md" />
            </label>
          </div>

          {txType === "sale" && (
            <div className="grid grid-cols-2 gap-3">
              <label>
                <div className="text-sm text-gray-400">Realtor commission %</div>
                <input type="number" value={commissionPct} onChange={(e) => setCommissionPct(e.target.value)} className="mt-1 p-2 w-full bg-gray-800 border border-gray-700 rounded-md" />
              </label>

              <div className="flex items-end">
                <button type="button" onClick={() => { setCommissionPct(5); }} className="px-3 py-2 rounded-md border border-gray-700 text-gray-200">Reset to 5%</button>
              </div>
            </div>
          )}

          {txType === "purchase" && (
            <div className="flex gap-3 items-end">
              <label className="flex items-center gap-2 text-gray-400">
                <input type="checkbox" checked={isToronto} onChange={(e) => setIsToronto(e.target.checked)} />
                <span className="text-sm">Located in City of Toronto (municipal LTT)</span>
              </label>

              <label className="flex items-center gap-2 text-gray-400">
                <input type="checkbox" checked={isFirstTimeBuyer} onChange={(e) => setIsFirstTimeBuyer(e.target.checked)} />
                <span className="text-sm">First-time home buyer</span>
              </label>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button type="submit" onClick={handleCalculate} className="px-4 py-2 bg-white text-black rounded-md">Calculate</button>
            <button type="button" onClick={() => { setResults(null); setMessage(null); }} className="px-4 py-2 border border-gray-700 rounded-md">Clear</button>
          </div>
        </form>

        {results && (
          <div className="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
            <h2 className="text-lg font-medium mb-3">Results</h2>

            {txType === "purchase" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-400">Ontario Land Transfer Tax</div>
                  <div className="text-xl font-semibold">{fmt(results.ontLTT)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Toronto Municipal LTT</div>
                  <div className="text-xl font-semibold">{fmt(results.torontoLTT)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">First-time buyer rebate</div>
                  <div className="text-xl font-semibold">{fmt(-results.ftbRebate)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Registration & Disbursements</div>
                  <div className="text-xl font-semibold">{fmt(results.regFees)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Title Insurance</div>
                  <div className="text-xl font-semibold">{fmt(results.titleInsurance)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Legal Fee</div>
                  <div className="text-xl font-semibold">{fmt(results.legalFee)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Adjustments (prorations)</div>
                  <div className="text-xl font-semibold">{fmt(results.adjustments)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Total Estimated Costs</div>
                  <div className="text-2xl font-bold">{fmt(results.totalCosts)}</div>
                </div>

                <div className="col-span-2 mt-3">
                  <div className="text-sm text-gray-400">Deposit already paid</div>
                  <div className="text-xl font-semibold">{fmt(Number(deposit || 0))}</div>

                  <div className="mt-2">
                    <div className="text-sm text-gray-400">Estimated Cash Required on Closing</div>
                    <div className="text-2xl font-bold">{fmt(results.cashRequired)}</div>
                  </div>
                </div>
              </div>
            )}

            {txType === "sale" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-400">Realtor commission</div>
                  <div className="text-xl font-semibold">{fmt(results.commission)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">HST on commission</div>
                  <div className="text-xl font-semibold">{fmt(results.hstOnCommission)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Mortgage payout</div>
                  <div className="text-xl font-semibold">{fmt(results.mortgagePayout)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Legal Fee</div>
                  <div className="text-xl font-semibold">{fmt(results.legalFee)}</div>
                </div>

                <div className="col-span-2 mt-3">
                  <div className="text-sm text-gray-400">Total Deductions</div>
                  <div className="text-2xl font-bold">{fmt(results.totalDeductions)}</div>

                  <div className="mt-2">
                    <div className="text-sm text-gray-400">Net proceeds to seller (approx.)</div>
                    <div className="text-2xl font-bold">{fmt(results.netProceeds)}</div>
                  </div>
                </div>
              </div>
            )}

            {txType === "refinance" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-400">Legal Fee</div>
                  <div className="text-xl font-semibold">{fmt(results.legalFee)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Title Insurance (lender)</div>
                  <div className="text-xl font-semibold">{fmt(results.titleInsurance)}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-400">Registration Fees</div>
                  <div className="text-xl font-semibold">{fmt(results.regFees)}</div>
                </div>

                <div className="col-span-2 mt-3">
                  <div className="text-sm text-gray-400">Total Costs</div>
                  <div className="text-2xl font-bold">{fmt(results.totalCosts)}</div>

                  <div className="mt-2">
                    <div className="text-sm text-gray-400">Net advanced to borrower (approx.)</div>
                    <div className="text-2xl font-bold">{fmt(results.netAdvance)}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <form onSubmit={handleEmail} className="flex gap-2 items-center">
                <input type="email" placeholder="your@email.com" value={email} onChange={(e)=>setEmail(e.target.value)} className="p-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200" />
                <button type="submit" disabled={loading} className="px-4 py-2 bg-white text-black rounded-md">{loading ? 'Sending…' : 'Email PDF'}</button>
              </form>

              {message && (
                <div className={`mt-3 text-sm ${message.type==='error'? 'text-rose-400':'text-emerald-400'}`}>
                  {message.text}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
