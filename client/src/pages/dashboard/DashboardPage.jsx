import React from 'react'
import Totalbar from "./components/Totalbar"
import SaleStatisticGraph from "./components/SaleStatisticGraph"
import MemberStatisticGraph from "./components/MemberStatisticGraph"
import TopMenuTable from "./components/TopMenuTable"
import TopCategoriesGraph from "./components/TopCategoriesGraph"
import Filterbar from './components/Filterbar'

const DashboardPage = () => {
  return (
    <div className='page-pad'>
      <div className='grid grid-cols-1 gap-6'>
        
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-semibold'>Dashboard</h2>
          <Filterbar/>
        </div>
        
        <div>
          <Totalbar/>
        </div>
        
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2'>
            <SaleStatisticGraph/>
          </div>
          <div className='lg:col-span-1'>
            <MemberStatisticGraph/>
          </div>
        </div>
        
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2'>
            <TopMenuTable/>
          </div>
          <div className='lg:col-span-1'>
            <TopCategoriesGraph/>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage