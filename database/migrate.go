package database

// Migrate copies all data from one database to another. Currently, no advanced handling is done, so
// migration is only done optimistically.
func Migrate(from Database, to Database) error {
	// Copy settings
	if settings, err := from.GetSettings(); err == nil {
		_ = to.SaveSettings(settings)
	}

	// Copy templates
	templates, err := from.GetTemplates()
	if err != nil {
		return err
	}

	for i := range templates {
		err := to.SaveTemplate(templates[i].Template)
		if err != nil {
			return err
		}

		entries, err := from.GetEntries(templates[i].ID())
		if err != nil {
			return err
		}

		err = to.SaveEntries(templates[i].ID(), entries)
		if err != nil {
			return err
		}
	}

	// Copy sources
	sources, err := from.GetSources()
	if err != nil {
		return err
	}

	for i := range sources {
		err := to.SaveSource(sources[i].DataSource)
		if err != nil {
			return err
		}

		entries, err := from.GetEntries(sources[i].ID())
		if err != nil {
			return err
		}

		err = to.SaveEntries(sources[i].ID(), entries)
		if err != nil {
			return err
		}
	}

	// Copy generators
	generators, err := from.GetGenerators()
	if err != nil {
		return err
	}

	for i := range generators {
		err := to.SaveGenerator(generators[i])
		if err != nil {
			return err
		}
	}

	return nil
}
