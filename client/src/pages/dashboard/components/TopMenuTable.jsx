import React, { useEffect, useState, useMemo } from 'react'

const mockTopMenus = [
  { menu_name: "Americano", category: "Coffee", total_order: 120, total_revenue: 54000 },
  { menu_name: "Latte", category: "Coffee", total_order: 98, total_revenue: 49000 },
  { menu_name: "Cappuccino", category: "Coffee", total_order: 75, total_revenue: 39000 },
  { menu_name: "Matcha Latte", category: "Tea", total_order: 62, total_revenue: 42000 },
  { menu_name: "Chocolate", category: "Other", total_order: 55, total_revenue: 36000 },
]

const formatMoney = (v) => {
  const n = Number(v || 0)
  return n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const formatInt = (v) => Number(v || 0).toLocaleString("th-TH")

const TopMenuTable = ({ params, limit = 5 }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [rows, setRows] = useState([])
  
  const query = useMemo(() => {
    const p = params || {}
    const q = { limit }
    
    if (p.from) q.from = p.from
    if (p.to) q.to = p.to
    if (p.branch_id) q.branch_id = p.branch_id
    
    return q
  }, [params, limit])
  
  useEffect(() => {
    let alive = true
    
    const loading = async () => {
      setLoading(true)
      setError("")
      try {
        if (alive) {
          setRows(mockTopMenus)
        }
      } catch {
        if (alive) {
          setError("โหลดข้อมูลเมนูขายดีไม่สำเร็จ")
          setRows([])
        }
      } finally {
        if (alive) {
          setLoading(false)
        }
      }
    }
    
    loading()
    
    return () => {
      alive = false
    }
  }, [query])
  
  return (
    <div className='rounded-lg border border-gray-100 bg-white p-4 shadow-sm'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <div className='text-base font-semibold text-gray-900'>Top Menu</div>
          <div className='text-xs text-gray-400'>Best selling menus</div>
        </div>
      </div>
      
      <div className='overflow-x-auto'>
        <table className='w-full border-collapse text-sm'>
          <thead>
            <tr className='border-b text-left text-sm'>
              <th className='py-2 pr-2'>#</th>
              <th className='py-2 pr-2'>Menu</th>
              <th className='py-2 pr-2'>Category</th>
              <th className='py-2 pr-2 text-right'>Orders</th>
              <th className='py-2 text-right'>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(limit)].map((_, i) => (
                <tr key={i} className='border-b'>
                  <td colSpan={5} className='py-3'>
                    <div className='h-4 w-full animate-pulse rounded bg-gray-100'/>
                  </td>
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className='py-6 text-center text-gray-400'>
                  {error || "ไม่มีข้อมูล"}
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.rank} className='border-b border-gray-300 last:border-b-0 hover:bg-gray-50'>
                  <td className='py-3 pr-2 font-medium'>{r.rank}</td>
                  <td className='py-3 pr-2'>{r.menu_name}</td>
                  <td className='py-3 pr-2 text-gray-500'>{r.category}</td>
                  <td className='py-3 pr-2 text-right'>{formatInt(r.total_order)}</td>
                  <td className='py-3 text-right font-medium'>
                    ฿ {formatMoney(r.total_revenue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {error && !loading && (
        <div className='mt-2 text-sm text-red-500'>{error}</div>
      )}
    </div>
  )
}

export default TopMenuTable