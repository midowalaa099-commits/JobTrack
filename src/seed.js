export function sampleApplications(baseDate = new Date()) {
  const day = offset => {
    const d=new Date(baseDate.getFullYear(),baseDate.getMonth(),baseDate.getDate()+offset);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  return [
    ['Northstar Labs','Junior Laravel Developer','Cairo, Egypt','hybrid','interview',-8,2,`${day(2)}T14:00`,'LinkedIn',12000,18000,'Prepare REST API examples and explain database transactions.'],
    ['Orbit Studio','Backend Developer','Remote','remote','applied',-4,1,'','Company website',15000,22000,'Interested in their SaaS products. Follow up after one week.'],
    ['Cedar Tech','PHP Developer','Alexandria, Egypt','onsite','screening',-6,0,'','Referral',10000,16000,'Initial recruiter conversation completed.'],
    ['Pixel Harbor','Full Stack Developer','Remote','remote','saved',-2,null,'','LinkedIn',18000,25000,'Review the requirements and tailor the portfolio before applying.'],
    ['BrightPath Learning','AI Instructor','Giza, Egypt','hybrid','interview',-10,3,`${day(5)}T11:30`,'Company website',9000,14000,'Prepare a short explanation of sensors for children.'],
    ['Maple Systems','Junior Software Engineer','Cairo, Egypt','hybrid','applied',-3,-1,'','Job board',14000,20000,'Application submitted with CV and portfolio.'],
    ['Cloudfield','Laravel API Developer','Remote','remote','offer',-14,null,'','Referral',20000,24000,'Sample offer received. Compare the learning opportunities and responsibilities.'],
    ['Atlas Works','Web Developer','Mansoura, Egypt','onsite','rejected',-18,null,'','LinkedIn',8000,12000,'Sample rejection. Keep improving and continue applying.'],
    ['Lumen Digital','PHP Internship','Remote','remote','saved',-1,null,'','Company website',null,null,'A possible internship to research.'],
    ['Echo Solutions','Backend Developer','Giza, Egypt','hybrid','archived',-30,null,'','Job board',12000,17000,'Archived sample position.']
  ].map(([company,role,location,workMode,stage,applied,followup,interviewAt,source,salaryMin,salaryMax,notes],index)=>({id:`demo-${index+1}`,company,role,location,workMode,stage,source,url:'',appliedDate:stage==='saved'?'':day(applied),followUpDate:followup===null?'':day(followup),interviewAt,interviewType:'video',contactName:'',contactEmail:'',salaryMin,salaryMax,notes,createdAt:`${day(applied)}T09:00:00.000Z`,updatedAt:`${day(-index)}T10:00:00.000Z`}));
}
