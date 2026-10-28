import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = url && key ? createClient(url, key) : null;
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (date) => date ? new Date(date + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
const average = (arr) => arr.length ? arr.reduce((sum, item) => sum + Number(item.score), 0) / arr.length : 0;

export default function App() {
  const [page, setPage] = useState('Dashboard');
  const [employees, setEmployees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseFilter, setCourseFilter] = useState('todos');
  const [employeeFilter, setEmployeeFilter] = useState('todos');
  const [yearFilter, setYearFilter] = useState(String(new Date().getFullYear()));
  const [employeeForm, setEmployeeForm] = useState({ name: '', role: '', registration: '' });
  const [courseForm, setCourseForm] = useState({ name: '', description: '' });
  const [gradeForm, setGradeForm] = useState({ employee_id: '', course_id: '', assessment_name: 'Prova 1', score: '', assessment_date: today(), notes: '' });

  async function loadData() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true); setError('');
    const [e, c, a] = await Promise.all([
      supabase.from('employees').select('*').order('name'),
      supabase.from('courses').select('*').order('name'),
      supabase.from('assessments').select('*, employees(name, registration), courses(name)').order('assessment_date', { ascending: false })
    ]);
    const err = e.error || c.error || a.error;
    if (err) setError('Não foi possível carregar os dados. Confira a configuração do Supabase e execute supabase/schema.sql. Detalhe: ' + err.message);
    setEmployees(e.data || []); setCourses(c.data || []); setAssessments(a.data || []);
    setLoading(false);
  }
  useEffect(() => { loadData(); }, []);

  const activeEmployees = employees.filter(x => x.active);
  const activeCourses = courses.filter(x => x.active);
  const filtered = useMemo(() => assessments.filter(a =>
    (courseFilter === 'todos' || a.course_id === courseFilter) &&
    (employeeFilter === 'todos' || a.employee_id === employeeFilter) &&
    (!yearFilter || String(a.assessment_date).slice(0, 4) === yearFilter)
  ), [assessments, courseFilter, employeeFilter, yearFilter]);
  const chartData = activeCourses.map(course => ({
    curso: course.name.length > 22 ? course.name.slice(0, 22) + '…' : course.name,
    média: Number(average(filtered.filter(a => a.course_id === course.id)).toFixed(1))
  })).filter(x => x.média > 0);
  const passRate = filtered.length ? filtered.filter(a => Number(a.score) >= 70).length / filtered.length * 100 : 0;

  async function addEmployee(e) {
    e.preventDefault();
    if (!supabase) return;
    const result = await supabase.from('employees').insert({ ...employeeForm, name: employeeForm.name.trim(), registration: employeeForm.registration.trim() });
    if (result.error) { alert('Não foi possível cadastrar. Verifique se a matrícula já existe. ' + result.error.message); return; }
    setEmployeeForm({ name: '', role: '', registration: '' }); loadData();
  }
  async function addCourse(e) {
    e.preventDefault();
    if (!supabase) return;
    const result = await supabase.from('courses').insert({ ...courseForm, name: courseForm.name.trim() });
    if (result.error) { alert('Não foi possível cadastrar o curso: ' + result.error.message); return; }
    setCourseForm({ name: '', description: '' }); loadData();
  }
  async function addGrade(e) {
    e.preventDefault();
    if (!supabase) return;
    if (!gradeForm.employee_id || !gradeForm.course_id) { alert('Selecione o funcionário e o curso.'); return; }
    const result = await supabase.from('assessments').insert({ ...gradeForm, score: Number(gradeForm.score) });
    if (result.error) { alert('Não foi possível salvar a nota: ' + result.error.message); return; }
    setGradeForm({ employee_id: '', course_id: '', assessment_name: 'Prova 1', score: '', assessment_date: today(), notes: '' }); loadData();
  }
  async function archive(table, id, label) {
    if (!confirm('Deseja excluir/arquivar ' + label + '? O histórico de avaliações será preservado.')) return;
    const result = await supabase.from(table).update({ active: false }).eq('id', id);
    if (result.error) { alert('Não foi possível excluir: ' + result.error.message); return; }
    loadData();
  }

  const nav = ['Dashboard', 'Funcionários', 'Cursos', 'Lançar notas', 'Histórico'];
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">S</div><div><strong>SCHAEFER</strong><span>YACHTS</span></div></div>
      <div className="side-label">CENTRO DE TREINAMENTOS</div>
      <nav>{nav.map(item => <button key={item} className={page === item ? 'nav-item active' : 'nav-item'} onClick={() => setPage(item)}><span className="nav-dot" />{item}</button>)}</nav>
      <div className="side-footer"><span className="status-dot" /> Gestão de capacitação</div>
    </aside>
    <main className="main">
      <header className="topbar"><div><span className="eyebrow">SCHAEFER YACHTS / DESENVOLVIMENTO</span><h1>{page}</h1></div><div className="topbar-right"><span className="date-chip">{new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span><div className="avatar">CT</div></div></header>
      {!supabase && <div className="notice warning"><strong>Banco de dados ainda não conectado.</strong><br/>O sistema está preparado, mas para salvar e compartilhar funcionários, cursos e notas entre dispositivos, configure <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> e execute <code>supabase/schema.sql</code> no Supabase.</div>}
      {error && <div className="notice error">{error}</div>}
      {loading ? <div className="loading">Carregando dados…</div> : <>
      {page === 'Dashboard' && <section>
        <div className="welcome"><div><span className="eyebrow light">PAINEL DE INDICADORES</span><h2>Desenvolvimento que move<br/>a excelência.</h2><p>Acompanhe a evolução técnica dos colaboradores e os resultados dos treinamentos.</p></div><div className="welcome-symbol">SY<span>✦</span></div></div>
        <div className="filters"><label>Curso<select value={courseFilter} onChange={e => setCourseFilter(e.target.value)}><option value="todos">Todos os cursos</option>{activeCourses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Funcionário<select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}><option value="todos">Todos os funcionários</option>{activeEmployees.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Ano<select value={yearFilter} onChange={e => setYearFilter(e.target.value)}><option value="">Todos os anos</option>{[new Date().getFullYear(), new Date().getFullYear()-1, new Date().getFullYear()-2, new Date().getFullYear()-3].map(y => <option key={y}>{y}</option>)}</select></label></div>
        <div className="metric-grid">
          <Metric label="Funcionários ativos" value={activeEmployees.length} detail="Colaboradores cadastrados" icon="♙"/>
          <Metric label="Cursos disponíveis" value={activeCourses.length} detail="Trilhas de capacitação" icon="▤"/>
          <Metric label="Provas realizadas" value={filtered.length} detail="Conforme filtros selecionados" icon="✓"/>
          <Metric label="Média das avaliações" value={filtered.length ? average(filtered).toFixed(1).replace('.', ',') : '—'} detail="Escala de 0 a 100 pontos" icon="↗"/>
        </div>
        <div className="dashboard-grid"><div className="panel chart-panel"><div className="panel-heading"><div><h3>Desempenho por curso</h3><p>Média das notas no período selecionado</p></div><span className="pill">0–100 pontos</span></div>{chartData.length ? <div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 12, right: 12, left: -18, bottom: 20 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8edf2"/><XAxis dataKey="curso" tick={{ fill: '#6c7b8a', fontSize: 11 }} angle={-15} textAnchor="end" interval={0}/><YAxis domain={[0,100]} tick={{ fill: '#6c7b8a', fontSize: 11 }}/><Tooltip formatter={v => [v + ' pontos', 'Média']}/><Bar dataKey="média" fill="#1c5279" radius={[6,6,0,0]} maxBarSize={48}/></BarChart></ResponsiveContainer></div> : <Empty text="As médias aparecerão aqui quando houver avaliações cadastradas."/>}</div>
          <div className="panel approval-panel"><div className="panel-heading"><div><h3>Indicadores de qualidade</h3><p>Resultado das avaliações</p></div></div><div className="pass-ring" style={{'--pct': passRate + '%'}}><div><strong>{filtered.length ? Math.round(passRate) + '%' : '—'}</strong><span>aprovação</span></div></div><div className="legend-row"><span className="legend-dot good"/> Nota igual ou superior a 70 <strong>{filtered.filter(a => Number(a.score) >= 70).length}</strong></div><div className="legend-row"><span className="legend-dot low"/> Nota abaixo de 70 <strong>{filtered.filter(a => Number(a.score) < 70).length}</strong></div><p className="footnote">Critério inicial de aprovação: nota mínima 70/100. Pode ser ajustado conforme a regra da empresa.</p></div></div>
        <div className="panel"><div className="panel-heading"><div><h3>Últimas avaliações</h3><p>Registros mais recentes do histórico</p></div><button className="text-button" onClick={() => setPage('Histórico')}>Ver histórico →</button></div><AssessmentTable rows={filtered.slice(0,6)} onDelete={null}/></div>
      </section>}
      {page === 'Funcionários' && <section><div className="page-intro"><div><h2>Cadastro de funcionários</h2><p>Gerencie colaboradores e consulte seus registros de treinamento.</p></div><span className="count-badge">{activeEmployees.length} ativos</span></div><div className="panel form-panel"><h3>Novo funcionário</h3><form className="form-grid" onSubmit={addEmployee}><Field label="Nome completo"><input required value={employeeForm.name} onChange={e=>setEmployeeForm({...employeeForm,name:e.target.value})} placeholder="Nome do colaborador"/></Field><Field label="Cargo"><input required value={employeeForm.role} onChange={e=>setEmployeeForm({...employeeForm,role:e.target.value})} placeholder="Cargo / função"/></Field><Field label="Matrícula"><input required value={employeeForm.registration} onChange={e=>setEmployeeForm({...employeeForm,registration:e.target.value})} placeholder="Número da matrícula"/></Field><button className="primary-button" disabled={!supabase}>+ Cadastrar funcionário</button></form></div><div className="panel"><div className="panel-heading"><div><h3>Funcionários cadastrados</h3><p>Exclusão arquiva o cadastro e preserva as notas</p></div></div><div className="table-wrap"><table><thead><tr><th>Funcionário</th><th>Cargo</th><th>Matrícula</th><th>Provas</th><th>Média</th><th>Ação</th></tr></thead><tbody>{activeEmployees.map(emp=>{const rows=assessments.filter(a=>a.employee_id===emp.id);return <tr key={emp.id}><td className="person-cell"><span className="person-avatar">{emp.name.split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</span><strong>{emp.name}</strong></td><td>{emp.role}</td><td>{emp.registration}</td><td>{rows.length}</td><td><strong>{rows.length ? average(rows).toFixed(1).replace('.',',') : '—'}</strong></td><td><button className="danger-link" onClick={()=>archive('employees',emp.id,emp.name)}>Excluir</button></td></tr>})}</tbody></table>{!activeEmployees.length&&<Empty text="Nenhum funcionário cadastrado ainda."/>}</div></div></section>}
      {page === 'Cursos' && <section><div className="page-intro"><div><h2>Catálogo de cursos</h2><p>Cadastre as capacitações oferecidas pelo Centro de Treinamentos.</p></div><span className="count-badge">{activeCourses.length} cursos</span></div><div className="panel form-panel"><h3>Novo curso</h3><form className="form-grid two" onSubmit={addCourse}><Field label="Nome do curso"><input required value={courseForm.name} onChange={e=>setCourseForm({...courseForm,name:e.target.value})} placeholder="Ex.: Catalisação de resina"/></Field><Field label="Descrição"><input value={courseForm.description} onChange={e=>setCourseForm({...courseForm,description:e.target.value})} placeholder="Conteúdo ou objetivo do curso"/></Field><button className="primary-button" disabled={!supabase}>+ Cadastrar curso</button></form></div><div className="course-grid">{activeCourses.map(c=><div className="course-card" key={c.id}><div className="course-icon">▤</div><div className="course-title">{c.name}</div><p>{c.description||'Curso de capacitação interna'}</p><div className="course-bottom"><span>{assessments.filter(a=>a.course_id===c.id).length} avaliações</span><button className="danger-link" onClick={()=>archive('courses',c.id,c.name)}>Excluir</button></div></div>)}</div>{!activeCourses.length&&<div className="panel"><Empty text="Cadastre o primeiro curso para começar."/></div>}</section>}
      {page === 'Lançar notas' && <section><div className="page-intro"><div><h2>Registrar avaliação</h2><p>Cada lançamento cria um novo registro e mantém as provas anteriores.</p></div></div><div className="panel form-panel grade-panel"><h3>Dados da prova</h3><form className="form-grid two" onSubmit={addGrade}><Field label="Funcionário"><select required value={gradeForm.employee_id} onChange={e=>setGradeForm({...gradeForm,employee_id:e.target.value})}><option value="">Selecione o funcionário</option>{activeEmployees.map(x=><option key={x.id} value={x.id}>{x.name} — {x.registration}</option>)}</select></Field><Field label="Curso"><select required value={gradeForm.course_id} onChange={e=>setGradeForm({...gradeForm,course_id:e.target.value})}><option value="">Selecione o curso</option>{activeCourses.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field><Field label="Identificação da avaliação"><input required value={gradeForm.assessment_name} onChange={e=>setGradeForm({...gradeForm,assessment_name:e.target.value})} placeholder="Ex.: Prova teórica 2"/></Field><Field label="Nota (0 a 100)"><input type="number" min="0" max="100" step="0.01" required value={gradeForm.score} onChange={e=>setGradeForm({...gradeForm,score:e.target.value})} placeholder="Ex.: 85"/></Field><Field label="Data da prova"><input type="date" required value={gradeForm.assessment_date} onChange={e=>setGradeForm({...gradeForm,assessment_date:e.target.value})}/></Field><Field label="Observações"><input value={gradeForm.notes} onChange={e=>setGradeForm({...gradeForm,notes:e.target.value})} placeholder="Observações opcionais"/></Field><button className="primary-button" disabled={!supabase}>Salvar avaliação</button></form></div><div className="info-strip"><strong>Importante:</strong> não edite uma nota antiga para registrar uma nova prova. Faça um novo lançamento para preservar a evolução do funcionário.</div></section>}
      {page === 'Histórico' && <section><div className="page-intro"><div><h2>Histórico de avaliações</h2><p>Consulte todas as provas realizadas, sem sobrescrever resultados anteriores.</p></div><button className="secondary-button" onClick={()=>downloadCSV(filtered)}>↓ Exportar CSV</button></div><div className="filters history-filters"><label>Curso<select value={courseFilter} onChange={e=>setCourseFilter(e.target.value)}><option value="todos">Todos os cursos</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Funcionário<select value={employeeFilter} onChange={e=>setEmployeeFilter(e.target.value)}><option value="todos">Todos os funcionários</option>{employees.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><label>Ano<select value={yearFilter} onChange={e=>setYearFilter(e.target.value)}><option value="">Todos os anos</option>{Array.from(new Set(assessments.map(a=>String(a.assessment_date).slice(0,4)))).sort().reverse().map(y=><option key={y}>{y}</option>)}</select></label></div><div className="panel"><div className="panel-heading"><div><h3>Registros encontrados</h3><p>{filtered.length} avaliações conforme os filtros</p></div></div><AssessmentTable rows={filtered}/></div></section>}
      </>}
      <footer>Centro de Treinamentos <span>•</span> Schaefer Yachts</footer>
    </main>
  </div>;
}

function Metric({label,value,detail,icon}) { return <div className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div><strong className="metric-value">{value}</strong><span className="metric-detail">{detail}</span></div>; }
function Field({label,children}) { return <label className="field"><span>{label}</span>{children}</label>; }
function Empty({text}) { return <div className="empty-state"><span>▤</span><p>{text}</p></div>; }
function AssessmentTable({rows}) { return <div className="table-wrap"><table><thead><tr><th>Data</th><th>Funcionário</th><th>Curso</th><th>Avaliação</th><th>Nota</th><th>Resultado</th></tr></thead><tbody>{rows.map(a=><tr key={a.id}><td>{fmt(a.assessment_date)}</td><td>{a.employees?.name || 'Funcionário'}</td><td>{a.courses?.name || 'Curso'}</td><td>{a.assessment_name}</td><td><strong>{Number(a.score).toLocaleString('pt-BR',{maximumFractionDigits:2})}</strong></td><td><span className={Number(a.score)>=70?'result-badge good':'result-badge low'}>{Number(a.score)>=70?'Aprovado':'Abaixo da meta'}</span></td></tr>)}</tbody></table>{!rows.length&&<Empty text="Nenhuma avaliação encontrada para os filtros selecionados."/>}</div>; }
function downloadCSV(rows) { const headers=['Data','Funcionário','Matrícula','Curso','Avaliação','Nota','Observações']; const values=rows.map(a=>[a.assessment_date,a.employees?.name,a.employees?.registration,a.courses?.name,a.assessment_name,a.score,a.notes]); const csv=[headers,...values].map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\n'); const blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}); const link=document.createElement('a'); link.href=URL.createObjectURL(blob); link.download='historico-avaliacoes-schaefer.csv'; link.click(); URL.revokeObjectURL(link.href); }
