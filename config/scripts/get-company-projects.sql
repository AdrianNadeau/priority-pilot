SELECT DISTINCT ON (p.id)   
    p.project_name,
    p.project_headline,
	ph.phase_name,
    p.project_cost, 
    p.health,
    p.effort,
    s.progress,
    p.benefit,
    p.start_date,
    p.end_date,
    p.next_milestone_date,
    s.status_date
FROM projects p
LEFT JOIN statuses s ON p.id = s.project_id_fk
LEFT JOIN companies c ON p.company_id_fk = c.id
LEFT JOIN phases ph ON p.phase_id_fk = ph.id  -- Join with phases table
WHERE p.company_id_fk = 23
ORDER BY p.id, s.status_date DESC;
