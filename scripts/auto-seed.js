const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

async function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.pbkdf2(password, salt, 100000, 64, 'sha512', (err, key) => {
      if (err) return reject(err);
      resolve(`pbkdf2$100000$sha512$${salt}$${key.toString('hex')}`);
    });
  });
}

async function main() {
  console.log('Verification de la base...');
  const schoolCount = await prisma.school.count();
  if (schoolCount > 0) { console.log('Base deja peuplee. Skip.'); return; }
  console.log('Base vide - demarrage du seed...');

  const school = await prisma.school.create({ data: { name: 'Institution SmartShule', slogan: 'L intelligence qui rapproche l ecole et la famille.', primaryColor: '#2563EB', secondaryColor: '#0F766E', tertiaryColor: '#F59E0B', currency: 'CDF', locale: 'fr-FR' } });
  await prisma.branding.create({ data: { schoolId: school.id, status: 'PUBLISHED', version: 1, primaryColor: '#2563EB', secondaryColor: '#0F766E', tertiaryColor: '#F59E0B', schoolName: 'Institution SmartShule', slogan: 'SmartShule', publishedAt: new Date() } });
  const year = await prisma.academicYear.create({ data: { schoolId: school.id, label: '2025-2026', startDate: new Date('2025-09-01'), endDate: new Date('2026-07-15'), active: true } });
  const dirP = await prisma.directorate.create({ data: { schoolId: school.id, name: 'Primaire', code: 'PRI' } });
  const dirS = await prisma.directorate.create({ data: { schoolId: school.id, name: 'Secondaire', code: 'SEC' } });
  const secM = await prisma.section.create({ data: { directorateId: dirS.id, name: 'Maths', code: 'MATH' } });
  const cp1 = await prisma.classroom.create({ data: { directorateId: dirP.id, academicYearId: year.id, name: 'CP1', capacity: 35 } });
  const sixA = await prisma.classroom.create({ data: { directorateId: dirS.id, sectionId: secM.id, academicYearId: year.id, name: '6eme A', capacity: 40 } });
  const maths = await prisma.subject.create({ data: { schoolId: school.id, name: 'Mathematiques', code: 'MATH' } });
  const fr = await prisma.subject.create({ data: { schoolId: school.id, name: 'Francais', code: 'FR' } });
  const pwd = await hashPassword('SmartShule2026!');
  const uDir = await prisma.user.create({ data: { email: 'direction@smartshule.demo', passwordHash: pwd, role: 'DIRECTION', displayName: 'Aime Mukendi', active: true } });
  const uPar = await prisma.user.create({ data: { email: 'parent1@smartshule.demo', passwordHash: pwd, role: 'PARENT', displayName: 'Jean Mbumba', active: true } });
  const uStu = await prisma.user.create({ data: { email: 'eleve1@smartshule.demo', passwordHash: pwd, role: 'STUDENT', displayName: 'Sarah Mbumba', active: true } });
  const guard = await prisma.guardian.create({ data: { schoolId: school.id, userId: uPar.id, firstName: 'Jean', lastName: 'Mbumba', phone: '+243812000001', email: 'parent1@smartshule.demo' } });
  const stu = await prisma.student.create({ data: { schoolId: school.id, matricule: 'SS-2025-0001', firstName: 'Sarah', lastName: 'Mbumba', gender: 'F', status: 'ACTIVE', userId: uStu.id } });
  await prisma.enrollment.create({ data: { studentId: stu.id, classroomId: sixA.id, academicYearId: year.id, status: 'ACTIVE' } });
  await prisma.guardianStudentLink.create({ data: { guardianId: guard.id, studentId: stu.id, relationship: 'PERE', isPrimary: true } });
  await prisma.announcement.create({ data: { schoolId: school.id, title: 'Bienvenue', content: 'Bienvenue dans SmartShule.', targetType: 'ALL', status: 'PUBLISHED', priority: 'NORMAL', publishedAt: new Date(), authorId: uDir.id } });
  
  const accounts = [
    { n: '530000', l: 'Caisse', c: 'TREASURY', t: 'ASSET', d: 'DEBIT', tr: true },
    { n: '510000', l: 'Banque', c: 'TREASURY', t: 'ASSET', d: 'DEBIT', tr: true },
    { n: '540000', l: 'Mobile Money', c: 'TREASURY', t: 'ASSET', d: 'DEBIT', tr: true },
    { n: '411001', l: 'Clients', c: 'CUSTOMER', t: 'ASSET', d: 'DEBIT', cu: true },
    { n: '445700', l: 'Taxes', c: 'TAX', t: 'LIABILITY', d: 'CREDIT', ta: true },
    { n: '419000', l: 'Avances', c: 'CUSTOMER', t: 'LIABILITY', d: 'CREDIT', cu: true },
    { n: '401000', l: 'Fournisseurs', c: 'SUPPLIER', t: 'LIABILITY', d: 'CREDIT', su: true },
    { n: '706100', l: 'Inscriptions', c: 'PRODUCT', t: 'REVENUE', d: 'CREDIT', pr: true },
    { n: '706200', l: 'Scolarite', c: 'PRODUCT', t: 'REVENUE', d: 'CREDIT', pr: true },
    { n: '706300', l: 'Transport', c: 'PRODUCT', t: 'REVENUE', d: 'CREDIT', pr: true },
    { n: '706400', l: 'Cantine', c: 'PRODUCT', t: 'REVENUE', d: 'CREDIT', pr: true },
    { n: '706500', l: 'Location salles', c: 'PRODUCT', t: 'REVENUE', d: 'CREDIT', pr: true },
    { n: '706600', l: 'Location vehicules', c: 'PRODUCT', t: 'REVENUE', d: 'CREDIT', pr: true },
    { n: '600000', l: 'Achats', c: 'CHARGE', t: 'EXPENSE', d: 'DEBIT' },
    { n: '640000', l: 'Personnel', c: 'CHARGE', t: 'EXPENSE', d: 'DEBIT' }
  ];
  for (const a of accounts) {
    await prisma.chartOfAccount.create({ data: { schoolId: school.id, accountNumber: a.n, accountLabel: a.l, accountClass: a.n[0], accountCategory: a.c, accountType: a.t, direction: a.d, isProductAccount: a.pr||false, isTaxAccount: a.ta||false, isTreasuryAccount: a.tr||false, isCustomerAccount: a.cu||false, isSupplierAccount: a.su||false, status: 'ACTIVE' } });
  }
  
  const journals = [
    { c: 'VE-SCO', l: 'Ventes scolaires', t: 'SALES' }, { c: 'VE-SAL', l: 'Ventes salles', t: 'SALES' },
    { c: 'VE-VEH', l: 'Ventes vehicules', t: 'SALES' }, { c: 'CAIS', l: 'Caisse', t: 'CASH' },
    { c: 'BQ', l: 'Banque', t: 'BANK' }, { c: 'ACHA', l: 'Achats', t: 'PURCHASE' },
    { c: 'PAIE', l: 'Paie', t: 'PAYROLL' }, { c: 'OD', l: 'Operations diverses', t: 'MISC' }
  ];
  for (const j of journals) {
    await prisma.accountingJournal.create({ data: { schoolId: school.id, code: j.c, label: j.l, journalType: j.t, status: 'ACTIVE' } });
  }
  
  await prisma.notification.create({ data: { userId: uDir.id, type: 'ANNOUNCEMENT', title: 'Bienvenue', message: 'SmartShule est configure.', read: false } });
  console.log('Seed termine !');
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error('Erreur:', e); prisma.$disconnect(); process.exit(0); });