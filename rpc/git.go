package rpc

import (
	"time"

	"github.com/BigJk/nra"
	"github.com/BigJk/snd/database"
	"github.com/BigJk/snd/git"
	"github.com/labstack/echo/v4"
)

func RegisterGit(route *echo.Group, db database.Database) {
	route.POST("/getPublicPackages", echo.WrapHandler(nra.MustBind(func() ([]git.PublicList, error) {
		set, err := db.GetSettings()
		if err != nil {
			return nil, err
		}

		packageRepos := append([]string{"https://raw.githubusercontent.com/BigJk/snd-package-repo/main/packages.json"}, set.PackageRepos...)

		var publics []git.PublicList
		for i := range packageRepos {
			if pub, err := git.GetPackages(packageRepos[i]); err == nil {
				publics = append(publics, pub)
			}
		}

		return publics, nil
	})))

	route.POST("/getRepo", echo.WrapHandler(nra.MustBind(git.GetRepo)))

	route.POST("/getPackages", echo.WrapHandler(nra.MustBind(func(url string, tag map[string]interface{}) ([]git.Package, error) {
		commitTime, _ := time.Parse(time.RFC3339, tag["date"].(string))

		packages, err := git.Repo{
			URL: url,
		}.Fetch(git.Tag{
			Hash: tag["hash"].(string),
			Name: tag["name"].(string),
			Date: commitTime,
		})
		if err != nil {
			return nil, err
		}

		for i := range packages {
			packages[i].Entries = nil
		}

		return packages, nil
	})))

	route.POST("/importPackage", echo.WrapHandler(nra.MustBind(func(url string, tag map[string]interface{}, id string) error {
		commitTime, _ := time.Parse(time.RFC3339, tag["date"].(string))

		packages, err := git.Repo{
			URL: url,
		}.Fetch(git.Tag{
			Hash: tag["hash"].(string),
			Name: tag["name"].(string),
			Date: commitTime,
		})
		if err != nil {
			return err
		}

		for i := range packages {
			switch packages[i].Type {
			case "template":
				if packages[i].Template.ID() == id {
					if err := db.SaveTemplate(*packages[i].Template); err != nil {
						return err
					}

					for j := range packages[i].Entries {
						if err := db.SaveEntry(packages[i].Template.ID(), packages[i].Entries[j]); err != nil {
							// TODO: log
						}
					}

					return nil
				}
			case "generator":
				if packages[i].Generator.ID() == id {
					if err := db.SaveGenerator(*packages[i].Generator); err != nil {
						return err
					}
					return nil
				}
			case "data source":
				if packages[i].DataSource.ID() == id {
					if err := db.SaveSource(*packages[i].DataSource); err != nil {
						return err
					}

					for j := range packages[i].Entries {
						if err := db.SaveEntry(packages[i].DataSource.ID(), packages[i].Entries[j]); err != nil {
							// TODO: log
						}
					}

					return nil
				}
			}
		}

		return nil
	})))
}
