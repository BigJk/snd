import requests


# This class is a simple Python SDK for the Sales & Dungeon API.
# It is automatically generated from the API definition.
#
# Requires the requests library to be installed.
# python -m pip install requests
#
# For the structure of "snd types" check the following files in the root of the repository:
# data_source.go, entry.go, generator.go, settings.go, template.go

class SndAPI:

    def __init__(self, base_url):
        """
        Initialize the Sales & Dungeon API class with the base URL of the API.

        Parameters:
        - base_url (str): The base URL of the API. Most likely "http://127.0.0.1:7123"
        """
        self.base_url = base_url

    def _make_request(self, endpoint, method='GET', params=None):
        url = f"{self.base_url}/{endpoint}"
        if method == 'GET':
            response = requests.get(url, params=params)
        elif method == 'POST':
            response = requests.post(url, json=params)
        elif method == 'DELETE':
            response = requests.delete(url, json=params)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        if response.status_code == 200:
            return response.json()
        else:
            response.raise_for_status()

    def get_settings(self, ):
        """
        Perform an action using the getSettings API endpoint.

        Parameters:

        """
        endpoint = "api/getSettings"
        return self._make_request(endpoint, method='POST', params=[])

    def imports_source_csv(self, arg0):
        """
        Perform an action using the importsSourceCSV API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsSourceCSV"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_printer(self, ):
        """
        Perform an action using the getPrinter API endpoint.

        Parameters:

        """
        endpoint = "api/getPrinter"
        return self._make_request(endpoint, method='POST', params=[])

    def get_version(self, ):
        """
        Perform an action using the getVersion API endpoint.

        Parameters:

        """
        endpoint = "api/getVersion"
        return self._make_request(endpoint, method='POST', params=[])

    def fetch_image(self, arg0):
        """
        Perform an action using the fetchImage API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/fetchImage"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_templates(self, ):
        """
        Perform an action using the getTemplates API endpoint.

        Parameters:

        """
        endpoint = "api/getTemplates"
        return self._make_request(endpoint, method='POST', params=[])

    def exports_generator_zip(self, arg0, arg1):
        """
        Perform an action using the exportsGeneratorZIP API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (list of dict): parameter
        """
        endpoint = "api/exportsGeneratorZIP"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def count_entries(self, arg0):
        """
        Perform an action using the countEntries API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/countEntries"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def sync_start(self, arg0, arg1):
        """
        Perform an action using the syncStart API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (str): parameter
        """
        endpoint = "api/syncStart"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def ai_providers(self, ):
        """
        Perform an action using the aiProviders API endpoint.

        Parameters:

        """
        endpoint = "api/aiProviders"
        return self._make_request(endpoint, method='POST', params=[])

    def ai_models(self, arg0):
        """
        Perform an action using the aiModels API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/aiModels"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def save_template(self, arg0):
        """
        Perform an action using the saveTemplate API endpoint.

        Parameters:
        - arg0 (dict [snd type template]): parameter
        """
        endpoint = "api/saveTemplate"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_available_printer(self, ):
        """
        Perform an action using the getAvailablePrinter API endpoint.

        Parameters:

        """
        endpoint = "api/getAvailablePrinter"
        return self._make_request(endpoint, method='POST', params=[])

    def exports_template(self, ):
        """
        Perform an action using the exportsTemplate API endpoint.

        Parameters:

        """
        endpoint = "api/exportsTemplate"
        return self._make_request(endpoint, method='POST', params=[])

    def save_generator(self, arg0):
        """
        Perform an action using the saveGenerator API endpoint.

        Parameters:
        - arg0 (dict [snd type generator]): parameter
        """
        endpoint = "api/saveGenerator"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_generators(self, ):
        """
        Perform an action using the getGenerators API endpoint.

        Parameters:

        """
        endpoint = "api/getGenerators"
        return self._make_request(endpoint, method='POST', params=[])

    def save_entry(self, arg0, arg1):
        """
        Perform an action using the saveEntry API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (dict [snd type entry]): parameter
        """
        endpoint = "api/saveEntry"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def imports_template_json(self, arg0):
        """
        Perform an action using the importsTemplateJSON API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsTemplateJSON"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def copy_entries(self, arg0, arg1):
        """
        Perform an action using the copyEntries API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (str): parameter
        """
        endpoint = "api/copyEntries"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def get_sources(self, ):
        """
        Perform an action using the getSources API endpoint.

        Parameters:

        """
        endpoint = "api/getSources"
        return self._make_request(endpoint, method='POST', params=[])

    def exports_source_folder(self, arg0, arg1):
        """
        Perform an action using the exportsSourceFolder API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (list of dict): parameter
        """
        endpoint = "api/exportsSourceFolder"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def exports_source_zip(self, arg0, arg1):
        """
        Perform an action using the exportsSourceZIP API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (list of dict): parameter
        """
        endpoint = "api/exportsSourceZIP"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def imports_source_5e_tools_folder(self, arg0):
        """
        Perform an action using the importsSource5eToolsFolder API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsSource5eToolsFolder"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def exports_template_folder(self, arg0, arg1):
        """
        Perform an action using the exportsTemplateFolder API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (list of dict): parameter
        """
        endpoint = "api/exportsTemplateFolder"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def imports_template(self, ):
        """
        Perform an action using the importsTemplate API endpoint.

        Parameters:

        """
        endpoint = "api/importsTemplate"
        return self._make_request(endpoint, method='POST', params=[])

    def imports_generator_url(self, arg0):
        """
        Perform an action using the importsGeneratorURL API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsGeneratorURL"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def delete_source(self, arg0):
        """
        Perform an action using the deleteSource API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/deleteSource"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def ai_cached(self, arg0, arg1, arg2):
        """
        Perform an action using the aiCached API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (str): parameter
        - arg2 (str): parameter
        """
        endpoint = "api/aiCached"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1, arg2])

    def save_settings(self, arg0):
        """
        Perform an action using the saveSettings API endpoint.

        Parameters:
        - arg0 (dict [snd type settings]): parameter
        """
        endpoint = "api/saveSettings"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def delete_template(self, arg0):
        """
        Perform an action using the deleteTemplate API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/deleteTemplate"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_template(self, arg0):
        """
        Perform an action using the getTemplate API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/getTemplate"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def imports_generator_zip(self, arg0):
        """
        Perform an action using the importsGeneratorZIP API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsGeneratorZIP"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def save_source(self, arg0):
        """
        Perform an action using the saveSource API endpoint.

        Parameters:
        - arg0 (dict [snd type data_source]): parameter
        """
        endpoint = "api/saveSource"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def imports_source_zip(self, arg0):
        """
        Perform an action using the importsSourceZIP API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsSourceZIP"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def imports_generator(self, ):
        """
        Perform an action using the importsGenerator API endpoint.

        Parameters:

        """
        endpoint = "api/importsGenerator"
        return self._make_request(endpoint, method='POST', params=[])

    def export_source_json(self, arg0):
        """
        Perform an action using the exportSourceJSON API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/exportSourceJSON"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def imports_source(self, ):
        """
        Perform an action using the importsSource API endpoint.

        Parameters:

        """
        endpoint = "api/importsSource"
        return self._make_request(endpoint, method='POST', params=[])

    def imports_source_5e_tools_single_file(self, arg0):
        """
        Perform an action using the importsSource5eToolsSingleFile API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsSource5eToolsSingleFile"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def sync_local_to_cloud(self, ):
        """
        Perform an action using the syncLocalToCloud API endpoint.

        Parameters:

        """
        endpoint = "api/syncLocalToCloud"
        return self._make_request(endpoint, method='POST', params=[])

    def import_generator_json(self, arg0):
        """
        Perform an action using the importGeneratorJSON API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/importGeneratorJSON"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def delete_entry(self, arg0, arg1):
        """
        Perform an action using the deleteEntry API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (str): parameter
        """
        endpoint = "api/deleteEntry"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def imports_source_json(self, arg0):
        """
        Perform an action using the importsSourceJSON API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsSourceJSON"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_files(self, arg0, arg1, arg2):
        """
        Perform an action using the getFiles API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (list of str): parameter
        - arg2 (bool): parameter
        """
        endpoint = "api/getFiles"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1, arg2])

    def new_version(self, ):
        """
        Perform an action using the newVersion API endpoint.

        Parameters:

        """
        endpoint = "api/newVersion"
        return self._make_request(endpoint, method='POST', params=[])

    def imports_generator_folder(self, arg0):
        """
        Perform an action using the importsGeneratorFolder API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsGeneratorFolder"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def imports_generator_json(self, arg0):
        """
        Perform an action using the importsGeneratorJSON API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsGeneratorJSON"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def delete_entries(self, arg0):
        """
        Perform an action using the deleteEntries API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/deleteEntries"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def imports_source_foundry_vtt(self, arg0):
        """
        Perform an action using the importsSourceFoundryVTT API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsSourceFoundryVTT"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_packages(self, arg0, arg1):
        """
        Perform an action using the getPackages API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (dict): parameter
        """
        endpoint = "api/getPackages"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def import_package(self, arg0, arg1, arg2):
        """
        Perform an action using the importPackage API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (dict): parameter
        - arg2 (str): parameter
        """
        endpoint = "api/importPackage"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1, arg2])

    def imports_template_folder(self, arg0):
        """
        Perform an action using the importsTemplateFolder API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsTemplateFolder"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_entries_with_sources(self, arg0):
        """
        Perform an action using the getEntriesWithSources API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/getEntriesWithSources"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def ai_prompt(self, arg0, arg1, arg2):
        """
        Perform an action using the aiPrompt API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (str): parameter
        - arg2 (str): parameter
        """
        endpoint = "api/aiPrompt"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1, arg2])

    def get_default_directories(self, ):
        """
        Perform an action using the getDefaultDirectories API endpoint.

        Parameters:

        """
        endpoint = "api/getDefaultDirectories"
        return self._make_request(endpoint, method='POST', params=[])

    def imports_template_zip(self, arg0):
        """
        Perform an action using the importsTemplateZIP API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsTemplateZIP"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def exports_generator(self, ):
        """
        Perform an action using the exportsGenerator API endpoint.

        Parameters:

        """
        endpoint = "api/exportsGenerator"
        return self._make_request(endpoint, method='POST', params=[])

    def exports_generator_folder(self, arg0, arg1):
        """
        Perform an action using the exportsGeneratorFolder API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (list of dict): parameter
        """
        endpoint = "api/exportsGeneratorFolder"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def get_entry(self, arg0, arg1):
        """
        Perform an action using the getEntry API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (str): parameter
        """
        endpoint = "api/getEntry"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def print(self, arg0):
        """
        Perform an action using the print API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/print"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def sync_stop(self, arg0):
        """
        Perform an action using the syncStop API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/syncStop"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_public_packages(self, ):
        """
        Perform an action using the getPublicPackages API endpoint.

        Parameters:

        """
        endpoint = "api/getPublicPackages"
        return self._make_request(endpoint, method='POST', params=[])

    def delete_generator(self, arg0):
        """
        Perform an action using the deleteGenerator API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/deleteGenerator"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def import_generator_url(self, arg0):
        """
        Perform an action using the importGeneratorUrl API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/importGeneratorUrl"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_entries(self, arg0):
        """
        Perform an action using the getEntries API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/getEntries"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def exports_source(self, ):
        """
        Perform an action using the exportsSource API endpoint.

        Parameters:

        """
        endpoint = "api/exportsSource"
        return self._make_request(endpoint, method='POST', params=[])

    def imports_source_fight_club_5e(self, arg0):
        """
        Perform an action using the importsSourceFightClub5e API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsSourceFightClub5e"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def sync_active(self, arg0):
        """
        Perform an action using the syncActive API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/syncActive"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_source(self, arg0):
        """
        Perform an action using the getSource API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/getSource"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def screenshot(self, arg0, arg1):
        """
        Perform an action using the screenshot API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (str): parameter
        """
        endpoint = "api/screenshot"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def preview_cache(self, arg0, arg1):
        """
        Perform an action using the previewCache API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (str): parameter
        """
        endpoint = "api/previewCache"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def imports_template_url(self, arg0):
        """
        Perform an action using the importsTemplateURL API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsTemplateURL"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_generator(self, arg0):
        """
        Perform an action using the getGenerator API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/getGenerator"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def sync_cloud_to_local(self, ):
        """
        Perform an action using the syncCloudToLocal API endpoint.

        Parameters:

        """
        endpoint = "api/syncCloudToLocal"
        return self._make_request(endpoint, method='POST', params=[])

    def exports_template_zip(self, arg0, arg1):
        """
        Perform an action using the exportsTemplateZIP API endpoint.

        Parameters:
        - arg0 (str): parameter
        - arg1 (list of dict): parameter
        """
        endpoint = "api/exportsTemplateZIP"
        return self._make_request(endpoint, method='POST', params=[arg0, arg1])

    def imports_source_folder(self, arg0):
        """
        Perform an action using the importsSourceFolder API endpoint.

        Parameters:
        - arg0 (list of dict): parameter
        """
        endpoint = "api/importsSourceFolder"
        return self._make_request(endpoint, method='POST', params=[arg0])

    def get_repo(self, arg0):
        """
        Perform an action using the getRepo API endpoint.

        Parameters:
        - arg0 (str): parameter
        """
        endpoint = "api/getRepo"
        return self._make_request(endpoint, method='POST', params=[arg0])