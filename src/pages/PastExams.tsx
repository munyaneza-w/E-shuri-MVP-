import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

import { FileText, Download, Search } from "lucide-react";

type PastExam = {
  id: string;
  title: string;
  subject: string;
  year_level: string;
  file_url: string;
};

type GroupedExams = {
  [year: string]: PastExam[];
};

const yearLevels = ["S1", "S2", "S3", "S4", "S5", "S6"];

export default function PastExams() {
  const [exams, setExams] = useState<GroupedExams>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchExams = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("past-exams").select("*");

      if (error) {
        setError("Failed to load past exams. Please try again later.");
        console.error("Past Exams fetch error:", error);
        setLoading(false);
        return;
      }

      const typedData = data as unknown as PastExam[];

      const grouped = typedData.reduce((acc: GroupedExams, exam) => {
        const year = exam.year_level || "Unknown";

        if (!acc[year]) acc[year] = [];
        acc[year].push(exam);

        return acc;
      }, {});

      setExams(grouped);
      setLoading(false);
    };

    fetchExams();
  }, []);

  const filteredExams = (year: string) => {
    if (!exams[year]) return [];

    return exams[year].filter((exam) =>
      exam.title.toLowerCase().includes(search.toLowerCase()) ||
      exam.subject.toLowerCase().includes(search.toLowerCase())
    );
  };

  if (loading) return <div className="text-center p-6 text-lg font-medium">Loading exams...</div>;

  if (error)
    return (
      <Alert variant="destructive" className="my-6 mx-auto max-w-xl">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      
      {/* Page Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Past National Examinations</CardTitle>
          <CardDescription>
            Explore past national exams organized by study year (S1–S6). Use the search bar to find subjects or titles.
          </CardDescription>
        </CardHeader>

        {/* Search Bar */}
        <div className="px-6 pb-6">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            <Input
              className="pl-10"
              placeholder="Search by subject or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Accordion by Study Year */}
      <Accordion type="single" collapsible className="w-full">
        {yearLevels.map((year) => {
          const examsForYear = filteredExams(year);
          return (
            <AccordionItem key={year} value={year}>
              <AccordionTrigger className="text-xl font-semibold">
                Study Year: <span className="ml-2 text-blue-600">{year}</span>
              </AccordionTrigger>

              <AccordionContent>
                {examsForYear.length > 0 ? (
                  <div className="grid md:grid-cols-2 gap-4 py-4">
                    {examsForYear.map((exam) => (
                      <Card key={exam.id} className="border border-gray-200 shadow-sm p-4">
                        <div className="flex items-center gap-4">
                          <FileText className="h-8 w-8 text-gray-600" />

                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{exam.title}</h3>
                            <p className="text-sm text-gray-600">Subject: {exam.subject}</p>
                          </div>

                          <Button variant="outline" asChild>
                            <a href={exam.file_url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4 mr-2" /> Download
                            </a>
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic px-4 py-3">
                    No exam papers available for {year}.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
