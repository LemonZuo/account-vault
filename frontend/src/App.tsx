import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import TableView from './components/TableView'
import { tables } from './tables'

export default function App() {
  const first = tables[0]?.key ?? 'apple'
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to={`/t/${first}`} replace />} />
        <Route path="t/:tableKey" element={<TableView />} />
      </Route>
    </Routes>
  )
}
