import React from 'react'
import Totalbar from "./components/Totalbar"
import SaleStatisticGraph from "./components/SaleStatisticGraph"
import MemberStatisticGraph from "./components/MemberStatisticGraph"
import TopMenuTable from "./components/TopMenuTable"
import TopCategoriesGraph from "./components/TopCategoriesGraph"

const DashboardPage = () => {
  return (
    <div className='page-pad'>
      <div className='grid grid-cols-1 gap-3'>
        
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Dashboard</h2>
          <div>Filter</div>
        </div>
        
        <div className='bg-white'>
          <Totalbar/>
        </div>
        
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 bg-white'>
            <SaleStatisticGraph/>
          </div>
          <div className='lg:col-span-1 bg-white'>
            <MemberStatisticGraph/>
          </div>
        </div>
        
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 bg-white'>
            <TopMenuTable/>
          </div>
          <div className='lg:col-span-1 bg-white'>
            <TopCategoriesGraph/>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage