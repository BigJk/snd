package git

import (
	"io/ioutil"
	"os"
	"time"

	"github.com/BigJk/snd/imexport"
	"github.com/go-git/go-billy/v5/memfs"
	"github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/storage/memory"
)

type Tag struct {
	Hash string    `json:"hash"`
	Name string    `json:"name"`
	Date time.Time `json:"date"`
}

type Repo struct {
	URL      string         `json:"url"`
	Readme   string         `json:"readme"`
	Versions map[string]Tag `json:"versions"`
}

func (r Repo) Fetch(tag Tag) ([]Package, error) {
	fs := memfs.New()
	store := memory.NewStorage()

	repo, err := git.Clone(store, fs, &git.CloneOptions{
		URL:               r.URL,
		RecurseSubmodules: git.NoRecurseSubmodules,
	})
	if err != nil {
		return nil, err
	}

	wt, err := repo.Worktree()
	if err != nil {
		return nil, err
	}

	if err := wt.Checkout(&git.CheckoutOptions{
		Hash: plumbing.NewHash(tag.Hash),
	}); err != nil {
		return nil, err
	}

	var packages []Package

	files, _ := fs.ReadDir("./")
	for i := range files {
		if files[i].IsDir() {
			imFs := ImportReaderFS{
				Folder: files[i].Name(),
				FS:     fs,
			}

			tmpl, entries, err := imexport.ImportTemplate(imFs)
			if err == nil {
				packages = append(packages, Package{
					Author:   tmpl.Author,
					Type:     "template",
					Version:  tag.Name,
					Template: &tmpl,
					Entries:  entries,
				})
			} else {
				ds, entries, err := imexport.ImportSource(imFs)
				if err == nil {
					packages = append(packages, Package{
						Author:     ds.Author,
						Type:       "data source",
						Version:    tag.Name,
						DataSource: &ds,
						Entries:    entries,
					})
				} else {
					gen, err := imexport.ImportGenerator(imFs)
					if err == nil {
						packages = append(packages, Package{
							Author:    gen.Author,
							Type:      "generator",
							Version:   tag.Name,
							Generator: &gen,
						})
					} else {
						// no s&d content found
					}
				}
			}
		}
	}

	return packages, nil
}

func GetRepo(url string) (Repo, error) {
	fs := memfs.New()
	repo, err := git.Clone(memory.NewStorage(), fs, &git.CloneOptions{
		URL: url,
	})
	if err != nil {
		return Repo{}, err
	}

	head, err := repo.Head()
	if err != nil {
		return Repo{}, err
	}

	headCommit, err := repo.CommitObject(head.Hash())
	if err != nil {
		return Repo{}, err
	}

	tags := map[string]Tag{
		head.Name().Short(): {
			Hash: head.Hash().String(),
			Name: head.Name().Short(),
			Date: headCommit.Author.When,
		},
	}

	tagsIter, err := repo.Tags()
	if err != nil {
		return Repo{}, err
	}

	if err := tagsIter.ForEach(func(ref *plumbing.Reference) error {
		commit, err := repo.CommitObject(ref.Hash())
		if err != nil {
			return err
		}

		if ref.Name().IsTag() {
			tags[ref.Name().Short()] = Tag{
				Hash: ref.Hash().String(),
				Name: ref.Name().Short(),
				Date: commit.Author.When,
			}
		}

		return nil
	}); err != nil {
		return Repo{}, err
	}

	repoRes := Repo{
		URL:      url,
		Versions: tags,
	}

	if readme, err := fs.OpenFile("./README.md", os.O_RDONLY, 0666); err == nil {
		if data, err := ioutil.ReadAll(readme); err == nil {
			repoRes.Readme = string(data)
		}
	}

	return repoRes, nil
}
