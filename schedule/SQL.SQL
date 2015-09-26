CREATE TABLE podcasts(
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    created timestamp,
    number VARCHAR(255),
    title   VARCHAR(600),
    description text,
    cover   varchar(255),
    duration    varchar(255),
    duration_type char(1),
    link    varchar(255),
    mp3 varchar(255),
    published varchar(255),
    podcast VARCHAR(100)
);

CREATE TABLE categories(
    id int AUTO_INCREMENT NOT NULL PRIMARY KEY,
    created timestamp DEFAULT current_timestamp,
    name VARCHAR(255)
);

CREATE TABLE podcast_categories(
    podcast_id int,
    category_id int,
    created timestamp DEFAULT current_timestamp
);

ALTER TABLE podcast_categories
ADD CONSTRAINT podcast_categories_podcasts_fk
FOREIGN KEY (podcast_id)
REFERENCES podcasts(id);

ALTER TABLE podcast_categories
ADD CONSTRAINT podcast_categories_category_fk
FOREIGN KEY (category_id)
REFERENCES categories(id);