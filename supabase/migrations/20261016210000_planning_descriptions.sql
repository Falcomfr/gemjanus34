-- Description shown in the planning pop-up; activities of the GEM itself follow the original site.
alter table public.planning_slots add column description text not null default '' check (char_length(description) <= 600);

update public.planning_slots set description = 'Un temps pour s''exprimer librement par les arts plastiques : dessin, peinture, couleurs. Aucun niveau n''est demandé.' where title = 'Expression créatrice';
update public.planning_slots set description = 'Une gymnastique douce d''origine chinoise : des mouvements lents, accordés à la respiration, pour se détendre et se recentrer.' where title = 'Qi Gong';
update public.planning_slots set description = 'En alternance, un temps d''échange libre entre adhérents ou un groupe de parole autour d''un thème. Chacun parle s''il le souhaite.' where title = 'Groupe d''échange libre / groupe de parole à thème';
update public.planning_slots set description = 'Un atelier autour des mots et de l''écriture.' where title = 'Les mots qui volent';
update public.planning_slots set description = 'Le jeudi matin, rendez-vous de 10 h à 10 h 45 au café Little Italy Shop, 4 bis cours Gambetta (près de l''arrêt Saint-Denis du tram 3), puis sortie : visite d''exposition, balade, pique-nique…' where title = 'GEM « Hors les murs »';
update public.planning_slots set description = 'Un temps convivial le dernier jeudi du mois, à la place du GEM « Hors les murs ». Inscription auprès de l''équipe.' where title = 'Soupe au caillou';
update public.planning_slots set description = 'Des postures simples et des exercices de respiration, adaptés à chacun, pour assouplir le corps et se détendre.' where title = 'Yoga en douceur';
update public.planning_slots set description = 'Un atelier d''écriture pour composer et partager des textes poétiques.' where title = 'Écriture poétique';
update public.planning_slots set description = 'Une technique de gravure : on creuse un motif dans une plaque de linoléum, puis on l''imprime sur papier.' where title = 'Linogravure';
update public.planning_slots set description = 'Le samedi, le GEM est ouvert par un adhérent porteur de clés ou par une animatrice, pour des temps collectifs : goûters, projections de film, repas, pétanque, sorties…' where title = 'Événements collectifs';
update public.planning_slots set description = 'Une fois par mois, un atelier de collage pour composer des images à partir de papiers, de magazines et de couleurs.' where title = 'Collage';
